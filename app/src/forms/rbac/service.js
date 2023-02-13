const Problem = require('api-problem');
const { v4: uuidv4 } = require('uuid');

const {
  FormRoleUser,
  FormSubmissionUser,
  IdentityProvider,
  User,
  UserFormAccess,
  UserSubmissions
} = require('../common/models');
const { queryUtils } = require('../common/utils');
const authService = require('../auth/service');
const { hasFormRole } = require('../auth/middleware/userAccess');
const { Roles } = require('../common/constants');

const service = {

  list: async () => {
    return FormRoleUser.query()
      .allowGraph('[form, userRole, user]')
      .withGraphFetched('[form, userRole, user]')
      .modify('orderCreatedAtDescending');
  },

  create: async (data) => {
    let trx;
    try {
      trx = await FormRoleUser.startTransaction();

      const obj = Object.assign({}, data);
      obj.id = uuidv4();

      await FormRoleUser.query(trx).insert(obj);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  update: async (id, data) => {
    let trx;
    try {
      const obj = await service.read(id);
      trx = await FormRoleUser.startTransaction();

      const update = {
        formId: data.formId,
        role: data.role,
        userId: data.userId
      };

      await FormRoleUser.query(trx).patchAndFetchById(obj.id, update);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (id) => {
    return FormRoleUser.query()
      .findById(id)
      .allowGraph('[form, userRole, user]')
      .withGraphFetched('[form, userRole, user]')
      .throwIfNotFound();
  },

  delete: async (id) => {
    return FormRoleUser.query()
      .deleteById(id)
      .throwIfNotFound();
  },

  readUser: async (id) => {
    return User.query()
      .findById(id)
      .throwIfNotFound();
  },

  getCurrentUser: async (currentUser, params) => {
    const user = Object.assign({}, currentUser);
    const accessLevels = [];
    if (user.public) {
      accessLevels.push('public');
    } else {
      if (params.public) accessLevels.push('public');
      if (params.idp) accessLevels.push('idp');
      if (params.team) accessLevels.push('team');
    }
    const filteredForms = authService.filterForms(user, user.forms, accessLevels);
    user.forms = filteredForms;
    return user;
  },

  getCurrentUserSubmissions: async (currentUser, params) => {
    params = queryUtils.defaultActiveOnly(params);
    const items = await UserSubmissions.query()
      .withGraphFetched('submissionStatus(orderDescending)')
      .modify('filterFormId', params.formId)
      .modify('filterFormSubmissionId', params.formSubmissionId)
      .modify('filterUserId', currentUser.id)
      .modify('filterActive', params.active)
      .modify('orderDefault');
    return items;
  },

  getFormUsers: async (params) => {
    params = queryUtils.defaultActiveOnly(params);
    const items = await UserFormAccess.query()
      .modify('filterUserId', params.userId)
      .modify('filterIdpUserId', params.idpUserId)
      .modify('filterUsername', params.username)
      .modify('filterFullName', params.fullName)
      .modify('filterFirstName', params.firstName)
      .modify('filterLastName', params.lastName)
      .modify('filterEmail', params.email)
      .modify('filterFormId', params.formId)
      .modify('filterFormName', params.formName)
      .modify('filterActive', params.active)
      .modify('filterByAccess', params.idps, params.roles, params.permissions)
      .modify('orderDefault');
    return items;
  },

  getSubmissionUsers: async (params) => {
    params = queryUtils.defaultActiveOnly(params);
    const items = await UserSubmissions.query()
      .withGraphFetched('user')
      .modify('filterFormSubmissionId', params.formSubmissionId)
      .modify('filterUserId', params.userId)
      .modify('filterActive', params.active)
      .modify('orderDefault');
    return items;
  },

  getUserForms: async (params) => {
    params = queryUtils.defaultActiveOnly(params);
    const items = await UserFormAccess.query()
      .modify('filterUserId', params.userId)
      .modify('filterIdpUserId', params.idpUserId)
      .modify('filterUsername', params.username)
      .modify('filterFullName', params.fullName)
      .modify('filterFirstName', params.firstName)
      .modify('filterLastName', params.lastName)
      .modify('filterEmail', params.email)
      .modify('filterFormId', params.formId)
      .modify('filterFormName', params.formName)
      .modify('filterActive', params.active)
      .modify('filterByAccess', params.idps, params.roles, params.permissions)
      .modify('orderDefault');

    return items;
  },

  setFormUsers: async (formId, userId, data, currentUser) => {
    // check this in middleware? 422 in valid params
    if (!formId || 0 === formId.length) {
      throw new Error();
    }

    let trx;
    try {
      trx = await FormRoleUser.startTransaction();
      // remove existing mappings...
      await FormRoleUser.query(trx)
        .delete()
        .where('formId', formId)
        .where('userId', userId);

      // create the batch and insert...
      if (!Array.isArray(data)) {
        data = [data];
      }
      // remove any data that isn't for this form...
      data = data.filter(d => d.formId === formId);
      if (userId && userId.length) {
        data = data.filter(d => d.userId === userId);
      }
      // add an id and save them
      const items = data.map(d => { return { id: uuidv4(), createdBy: currentUser.usernameIdp, ...d }; });
      if(items && items.length) await FormRoleUser.query(trx).insert(items);
      await trx.commit();
      return service.getFormUsers({ userId: userId, formId: formId });
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  modifySubmissionUser: async (formSubmissionId, userId, body, currentUser) => {
    if (!userId || !body.permissions) {
      throw new Problem(422, 'User ID or permissions missing from request');
    }

    let trx;
    try {
      trx = await FormSubmissionUser.startTransaction();
      // remove existing mappings for the user...
      await FormSubmissionUser.query(trx)
        .delete()
        .where('formSubmissionId', formSubmissionId)
        .where('userId', userId);

      // create the batch and insert. So if permissions is empty it removes the user from the submission
      if (body.permissions !== []) {
        // add ids and save them
        const items = body.permissions.map(perm => ({
          id: uuidv4(),
          formSubmissionId: formSubmissionId,
          userId: userId,
          createdBy: currentUser.usernameIdp,
          permission: perm
        }));
        if(items && items.length) await FormSubmissionUser.query(trx).insert(items);
      }
      await trx.commit();
      return service.getSubmissionUsers({ formSubmissionId: formSubmissionId });
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  removeMultiUsers: async(userId, formId, data, currentUser) => {
    // create the batch and insert...
    if (Array.isArray(data) && data.length!==0 && formId) {
      let trx;
      try {
        trx = await FormRoleUser.startTransaction();
        // remove existing mappings...
        await FormRoleUser.query(trx)
          .delete()
          .where('formId', formId)
          .whereIn('userId', data);

        await trx.commit();
        return;

      } catch (err) {
        if (trx) await trx.rollback();
        throw err;
      }
    }
  },
  /*
  *
  * @param data An array of roles being applied to a user id for a form id
  * @param currentUser A user that contains an array of form objects and the roles
  *                     that user has for that form.
  */
  setUserForms: async (userId, formId, data, currentUser) => {
    // check this in middleware? 422 in valid params
    if (!userId || 0 === userId.length) {
      throw new Error();
    }

    // The function route should be protected by checking if the
    // user is an owner or a team manager
    const isOwner = hasFormRole(currentUser, Roles.OWNER);

    if (!isOwner) {
      // They are just a team manager

      const userRoles = await FormRoleUser.query()
        .modify('filterUserId', userId);

      // If the user is trying to remove the team manager role for their own userid
      if (userRoles.some(fru => fru.role === Roles.TEAM_MANAGER) &&
        !data.some(role => role.role === Roles.TEAM_MANAGER) &&
        userId == currentUser.id) {
        throw new Error('You can\'t remove your own team manager role.');
      }

      // Can't update another user's roles if they are an owner
      if (userRoles.some(fru => fru.role === Roles.OWNER) && userId !== currentUser.id) {
        throw new Error('You can\'t update an owner\'s roles.');
      }

      // If the user is trying to remove the designer role for another userid
      if (userRoles.some(fru => fru.role === Roles.FORM_DESIGNER) &&
        !data.some(role => role.role === Roles.FORM_DESIGNER)) {
        throw new Error('You can\'t remove a form designer role.');
      }
      if (!userRoles.some(fru => fru.role === Roles.FORM_DESIGNER) &&
        data.some(role => role.role === Roles.FORM_DESIGNER)) {
        throw new Error('You can\'t add a form designer role.');
      }
    }

    let trx;
    try {
      trx = await FormRoleUser.startTransaction();
      // remove existing mappings...
      await FormRoleUser.query(trx)
        .delete()
        .where('userId', userId)
        .where('formId', formId);

      // create the batch and insert...
      if (!Array.isArray(data)) {
        data = [data];
      }
      // remove any data that isn't for this userId...
      data = data.filter(d => d.userId === userId);
      if (formId && formId.length) {
        data = data.filter(d => d.formId === formId);
      }
      // add an id and save them
      const items = data.map(d => { return { id: uuidv4(), createdBy: currentUser.usernameIdp, ...d }; });
      if(items && items.length) await FormRoleUser.query(trx).insert(items);
      await trx.commit();
      // return the new mappings
      const result = await service.getUserForms({ userId: userId, formId: formId });
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  getIdentityProviders: (params) => {
    return IdentityProvider.query()
      .modify('filterActive', params.active)
      .modify('orderDefault');
  }

};

module.exports = service;
