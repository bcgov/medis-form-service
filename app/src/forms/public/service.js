const reminderService = require('../email/reminderService');
const Problem = require('api-problem');
const { v4: uuidv4 } = require('uuid');
const { FormSubmission, FormSubmissionUser } = require('../common/models');
const formService = require('../form/service');
const validationMailService = require('../email/validationMailService');
const { Permissions } = require('../common/constants');
const { EmailTypes } = require('../common/constants');
const service = {
  sendReminderToSubmitter: async () => {
    return await reminderService._init();
  },
  multiSubmissionSuccess: async (data) => {
    let trx;
    try {
      // console.log(data);
      const formVersion = await formService.readVersion(data.formVersionId);

      const { identityProviders, enableSubmitterDraft, allowSubmitterToUploadFile, name, id } = await formService.readForm(formVersion.formId);

      if (!enableSubmitterDraft) throw new Problem(401, `This form is not allowed to save draft.`);

      if (!allowSubmitterToUploadFile) throw new Problem(401, `This form is not allowed for multi draft upload.`);
      // // Ensure we only record the user if the form is not public facing
      const isPublicForm = identityProviders.some((idp) => idp.code === 'public');

      if (!isPublicForm && !data.currentUser.public) {
        // Provide the submission creator appropriate CRUD permissions if this is a non-public form
        // we decided that subitter cannot delete or update their own submission unless it's a draft
        // We know this is the submission creator when we see the SUBMISSION_CREATE permission
        // These are adjusted at the update point if going from draft to submitted, or when adding
        // team submitters to a draft
        trx = await FormSubmission.startTransaction();
        const createdBy = data.currentUser.usernameIdp;
        const submissionDataArray = data.results;
        // this code have to review
        const recordWithoutData = {};
        let recordsToInsert = [];
        let submissionId;

        let itemsToInsert = [];

        const perms = [Permissions.SUBMISSION_CREATE, Permissions.SUBMISSION_READ];
        if (data.draft) {
          perms.push(Permissions.SUBMISSION_DELETE, Permissions.SUBMISSION_UPDATE);
        }
        // // let's create multiple submissions with same metadata
        submissionDataArray.map((singleData) => {
          submissionId = uuidv4();

          recordsToInsert.push({
            id: submissionId,
            formVersionId: formVersion.id,
            confirmationId: submissionId.substring(0, 8).toUpperCase(),
            createdBy: createdBy,
            draft: data.draft,
            submission: {
              metadata: recordWithoutData,
              data: singleData,
            },
          });

          itemsToInsert.push(
            ...perms.map((perm) => ({
              id: uuidv4(),
              userId: data.currentUser.id,
              formSubmissionId: submissionId,
              permission: perm,
              createdBy: createdBy,
            }))
          );
        });
        const results = await FormSubmission.query(trx).insert(recordsToInsert);
        // results.map((singleSubmission) => {
        // itemsToInsert.push(
        //   ...perms.map((perm) => ({
        //     id: uuidv4(),
        //     userId: data.currentUser.id,
        //     formSubmissionId: singleSubmission.id,
        //     permission: perm,
        //     createdBy: createdBy,
        //   }))
        // );
        // });
        const form = Object({
          id,
          name,
        });
        const obj = Object({
          multiSubmissionId: data.token,
        });
        validationMailService._init(form, data.currentUser, EmailTypes.MULTI_SUB_SUCCESS, obj);
        await FormSubmissionUser.query(trx).insert(itemsToInsert);
        await trx.commit();
        return results;
      } else {
        throw new Problem(401, `This operation is not allowed to public.`);
      }
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  multiSubmissionFailed: async (data) => {
    console.log(data);
  },
  multiSubmissionCrash: async (data) => {
    console.log(data);
  },
};

module.exports = service;
