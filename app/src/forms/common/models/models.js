const { Model } = require('objection');
const { Timestamps } = require('./mixins');

class Form extends Timestamps(Model) {
  static get tableName () {
    return 'form';
  }

  static get relationMappings () {
    return {
      versions: {
        relation: Model.HasManyRelation,
        modelClass: FormVersion,
        join: {
          from: 'form.id',
          to: 'form_version.formId'
        }
      }
    };
  }

  static get modifiers () {
    return {
      filterName(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('name', 'ilike', `%${value}%`);
        }
      },
      filterDescription(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('description', 'ilike', `%${value}%`);
        }
      },
      filterPublic(query, value) {
        if (value !== undefined) {
          query.where('public', value);
        }
      },
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      filterLabels(query, value) {
        if (value) {
          query.whereRaw(`'${value}' = ANY (labels)`);
        }
      },
      orderNameAscending(builder) {
        builder.orderByRaw('lower("name")');
      }
    };
  }
}

class FormVersion extends Timestamps(Model) {
  static get tableName () {
    return 'form_version';
  }

  static get relationMappings () {
    return {
      submissions: {
        relation: Model.HasManyRelation,
        modelClass: FormSubmission,
        join: {
          from: 'form_version.id',
          to: 'form_submission.formVersionId'
        }
      }
    };
  }

  static get modifiers () {
    return {
      filterFormId(query, value) {
        if (value !== undefined) {
          query.where('formId', value);
        }
      },
      orderVersionDescending(builder) {
        builder.orderBy('version', 'desc');
      }
    };
  }
}

class FormSubmission extends Timestamps(Model) {
  static get tableName () {
    return 'form_submission';
  }

  static get modifiers () {
    return {
      filterFormVersionId(query, value) {
        if (value !== undefined) {
          query.where('formVersionId', value);
        }
      },
      orderDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      }
    };
  }
}

class Permission extends Timestamps(Model) {
  static get tableName () {
    return 'permission';
  }

  static get relationMappings () {
    return {
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'permission.id',
          through: {
            from: 'role_permission.permissionId',
            to: 'role_permission.roleId'
          },
          to: 'role.id'
        }
      }
    };
  }

  static get modifiers () {
    return {
      filterName(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('name', 'ilike', `%${value}%`);
        }
      },
      filterDescription(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('description', 'ilike', `%${value}%`);
        }
      },
      orderNameAscending(builder) {
        builder.orderByRaw('lower("name")');
      }
    };
  }
}

class Role extends Timestamps(Model) {
  static get tableName () {
    return 'role';
  }

  static get relationMappings () {
    return {
      permissions: {
        relation: Model.ManyToManyRelation,
        modelClass: Permission,
        join: {
          from: 'role.id',
          through: {
            from: 'role_permission.roleId',
            to: 'role_permission.permissionId'
          },
          to: 'permission.id'
        }
      }
    };
  }

  static get modifiers () {
    return {
      filterName(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('name', 'ilike', `%${value}%`);
        }
      },
      filterDescription(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('description', 'ilike', `%${value}%`);
        }
      },
      orderNameAscending(builder) {
        builder.orderByRaw('lower("name")');
      }
    };
  }
}

class User extends Timestamps(Model) {
  static get tableName () {
    return 'user';
  }

  static get modifiers () {
    return {
      filterUsername(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('username', 'ilike', `%${value}%`);
        }
      },
      filterFirstName(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('firstName', 'ilike', `%${value}%`);
        }
      },
      filterLastName(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('lastName', 'ilike', `%${value}%`);
        }
      },
      filterFullName(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('displayName', 'ilike', `%${value}%`);
        }
      },
      filterEmail(query, value) {
        if (value) {
          // ilike is postrges case insensitive like
          query.where('email', 'ilike', `%${value}%`);
        }
      },
      orderLastFirstAscending(builder) {
        builder.orderByRaw('lower("lastName"), lower("firstName")');
      }
    };
  }
}

class FormRoleUser extends Timestamps(Model) {
  static get tableName () {
    return 'form_role_user';
  }

  static get relationMappings () {
    return {
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: 'form_role_user.formId',
          to: 'form.id'
        }
      },
      role: {
        relation: Model.HasOneRelation,
        modelClass: Role,
        join: {
          from: 'form_role_user.roleId',
          to: 'role.id'
        }
      },
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: 'form_role_user.userId',
          to: 'user.id'
        }
      },
    };
  }

  static get modifiers () {
    return {
      orderCreatedAtDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      },
      orderUpdatedAtDescending(builder) {
        builder.orderBy('updatedAt', 'desc');
      }
    };
  }
}


class UserFormRoles extends Model {
  static get tableName () {
    return 'user_form_roles_vw';
  }

  static get modifiers () {
    return {
      filterId(query, value) {
        if (value) {
          query.where('id', value);
        }
      },
      filterKeycloakId(query, value) {
        if (value) {
          query.where('keycloakId', value);
        }
      },
      filterUsername(query, value) {
        if (value) {
          query.where('username', 'ilike', `%${value}%`);
        }
      },
      filterFullName(query, value) {
        if (value) {
          query.where('fullName', 'ilike', `%${value}%`);
        }
      },
      filterFirstName(query, value) {
        if (value) {
          query.where('firstName', 'ilike', `%${value}%`);
        }
      },
      filterLastName(query, value) {
        if (value) {
          query.where('lastName', 'ilike', `%${value}%`);
        }
      },
      filterEmail(query, value) {
        if (value) {
          query.where('email', 'ilike', `%${value}%`);
        }
      },
      filterFormId(query, value) {
        if (value) {
          query.where('formId', value);
        }
      },
      filterFormName(query, value) {
        if (value) {
          query.where('formName', 'ilike', `%${value}%`);
        }
      },
      filterPublic(query, value) {
        if (value !== undefined) {
          query.where('public', value);
        }
      },
      filterActive(query, value) {
        if (value !== undefined) {
          query.where('active', value);
        }
      },
      filterArray(query, fieldName, value) {
        if (value) {
          query.whereRaw(`'${value}' = ANY (${fieldName})`);
        }
      },
      orderFormNameAscending(builder) {
        builder.orderByRaw('lower("formName")');
      },
      orderLastFirstAscending(builder) {
        builder.orderByRaw('lower("lastName"), lower("firstName")');
      },
      orderDefault(builder) {
        builder.orderByRaw('lower("lastName"), lower("firstName"), lower("formName")');
      }
    };
  }
}

class UserFormPermissions extends UserFormRoles {
  static get tableName () {
    return 'user_form_permissions_vw';
  }
}

module.exports = {
  Form: Form,
  FormSubmission: FormSubmission,
  FormRoleUser: FormRoleUser,
  FormVersion: FormVersion,
  Permission: Permission,
  Role: Role,
  User: User,
  UserFormPermissions: UserFormPermissions,
  UserFormRoles: UserFormRoles
};