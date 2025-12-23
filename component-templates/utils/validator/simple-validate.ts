import { useState } from 'react';

export const REGEXS = {
  /** 
   * /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
   * @example "7K7dI@ex.com"
  */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /**
   * /^[0-9]{10,11}$/
   * @example "0123456789"
   */
  phone: /^[0-9]{10,11}$/,
  /**
   * /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*(\?.*)?$/
   * @example "https://google.com"
   */
  url: /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*(\?.*)?$/,
  /**
   * /^[a-zA-Z0-9_]{3,20}$/
   * @example "abc123"
   */
  username: /^[a-zA-Z0-9_]{3,20}$/,
  /**
   * /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
   * @example "Abc123@"
   */
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
  /**
   * /^[0-9]{5,6}$/
   * @example "123456"
   */
  postalCode: /^[0-9]{5,6}$/,
  /**
   * /^\d+$/
   * @example "123"
   */
  number: /^\d+$/,
  /**
   * /^\d+(\.\d{1,2})?$/
   * @example "123.45"
   */
  decimal: /^\d+(\.\d{1,2})?$/,
  /**
   * /^[a-zA-Z0-9\s]{1,50}$/
   * @example "Lily Nguyen"
   */
  name: /^[a-zA-ZÀ-ỹ\s]{1,50}$/,
  /**
   * /^\d{4}-\d{2}-\d{2}$/
   * @example "2023-12-01"
   */
  date_4_2_2: /^\d{4}-\d{2}-\d{2}$/,
  /**
   * /^\d{2}-\d{4}-\d{2}$/
   * @example "12-2023-01"
   */
  date_2_4_2: /^\d{2}-\d{4}-\d{2}$/,
  /**
   * /^\d{2}-\d{2}-\d{4}$/
   * @example "12-01-2023"
   */
  date_2_2_4: /^\d{2}-\d{2}-\d{4}$/,
  /**
   * /^[a-zA-ZÀ-ỹ0-9\s]+$/,
   * @example "Hello Thế Giới"
   */
  text: /^[a-zA-ZÀ-ỹ0-9\s]+$/,
  /**
   * /^[a-zA-Z0-9\s.,#\/-]+$/
   * @example "123 Main St, Anytown, USA"
   */
  address: /^[a-zA-Z0-9\s.,#\/-]+$/,
  /**
   * /^(true|false|0|1)$/
   * @example "true"
   */
  boolean: /^(true|false|0|1)$/,
  /**
   * /^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}$/
   * @example "12345678-1234-1234-1234-123456789012"
   */
  uuid: /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/,
}

interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  minLength?: number;
  maxLength?: number;
  errorMessage?: string;
}

export type ValidationRules<T> = {
  [K in keyof T]: ValidationRule;
};

type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

export const useFormValidator = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});

  const validateField = (field: keyof T, value: T[keyof T]): string | undefined => {
    const rules = validationRules[field];
    if (!rules) return undefined;

    if (rules.required && !value) {
      return rules.errorMessage || "This field is required.";
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.errorMessage || "Invalid format.";
    }

    if (rules.minLength && value.length < rules.minLength) {
      return rules.errorMessage || `Minimum length is ${rules.minLength}.`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return rules.errorMessage || `Maximum length is ${rules.maxLength}.`;
    }

    if (rules.custom && !rules.custom(value)) {
      return rules.errorMessage || "Invalid value.";
    }

    return undefined;
  };

  const validateAllFields = (): boolean => {
    const newErrors: ValidationErrors<T> = {};
    let isValid = true;

    for (const field in validationRules) {
      const value = values[field];
      const error = validateField(field, value);
      if (error) {
        isValid = false;
        newErrors[field] = error;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // validate array of fields
  const validateFields = (fields: Array<keyof T>): boolean => {
    const newErrors: ValidationErrors<T> = {};
    let isValid = true;

    for (const field of fields) {
      const value = values[field];
      const error = validateField(field, value);
      if (error) {
        isValid = false;
        newErrors[field] = error;
      }
    }

    setErrors({...errors, ...newErrors});
    return isValid;
  };

  const handleChange = <K extends keyof T>(field: K, value: T[K]) => {
    setValues({...values, [field]: value});
    const error = validateField(field, value);
    setErrors({...errors, [field]: error});
  };

  return {
    /**
     * Form values
     * - ex: values.email
     */
    values,
    /**
     * Form errors
     * - ex: errors.email
     */
    errors,
    /** 
     * Update the form values
     * - ex: handleChange('email', 'a@example.com')
     */
    handleChange,
    /**
     * Validate all form fields
     * - ex: validateAllFields()
     * @returns boolean
     */
    validateAllFields,
    /**
     * Update entire the form values
     * @param newValues
     * - ex: setValues({ email: 'a@example.com', password: '123456' })
     */
    setValues,
    /**
     * Validate array of fields
     * - ex: validateFields(['email', 'password'])
     * @returns boolean
     */
    validateFields
  };
};



// import { useFormValidator, REGEXS } from '@/utils/validate/simple-validate';

// const validationRules = {
//   email: { required: true, pattern: REGEXS.email, errorMessage: "Please enter a valid email." },
//   password: { required: true, minLength: 6, errorMessage: "Password must be at least 6 characters." },
// };

// const { values, errors, handleChange, validateAllFields } = useFormValidator(
//   { email: '', password: '' },
//   validationRules
// );

// // On form submit
// const handleSubmit = () => {
//   if (validateAllFields()) {
//     // proceed with form submission
//   }
// };