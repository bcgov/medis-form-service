import baseEditForm from 'formiojs/components/email/Email.form';
import EditValidation from './editForm/Component.edit.validation';

export default function(...extend) {
    return baseEditForm([
        {
            key: 'validation',
            ignore: true
        },
        {
            label: 'Validation',
            key: 'customValidation',
            weight: 20,
            components: EditValidation
        }
    ], ...extend);
}
