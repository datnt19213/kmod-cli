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
   * /^[a-zA-ZÀ-ỹ0-9\s.,#\/-]+$/
   * @example "123 Main St, Anytown, USA"
   */
  address: /^[a-zA-ZÀ-ỹ0-9\s.,#\/-]+$/,
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

export interface ValidationRule<V = unknown> {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  errorMessage?: string;
  custom?: (value: V) => boolean;
}

export type ValidationRules<T> = Partial<{
  [K in keyof T]: ValidationRule<T[K]>;
}>;


type ValidationErrors<T> = {
  [K in keyof T]?: string;
};
type Touched<T> = Partial<Record<keyof T, boolean>>;

export const useFormValidator = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Touched<T>>({});


const validateField = <K extends keyof T>(
    field: K,
    value: T[K],
    isTouched = false,
    isSubmit = false
  ): string | undefined => {
    const rules = validationRules[field];
    if (!rules) return;

    // Not touched & not submit → no validate
    if (!isTouched && !isSubmit) return;

    // Not submit & value equals initial → no error
    if (!isSubmit && value === initialValues[field]) return;

    // REQUIRED
    if (rules.required) {
      if (
        value === '' ||
        value === null ||
        value === undefined
      ) {
        return rules.errorMessage || 'This field is required.';
      }
    }

    // PATTERN
    if (rules.pattern && typeof value === 'string' && value !== '') {
      if (!rules.pattern.test(value)) {
        return rules.errorMessage || 'Invalid format.';
      }
    }

    // MIN LENGTH
    if (rules.minLength && typeof value === 'string' && value !== '') {
      if (value.length < rules.minLength) {
        return rules.errorMessage || `Minimum length is ${rules.minLength}.`;
      }
    }

    // MAX LENGTH
    if (rules.maxLength && typeof value === 'string' && value !== '') {
      if (value.length > rules.maxLength) {
        return rules.errorMessage || `Maximum length is ${rules.maxLength}.`;
      }
    }

    // CUSTOM
    if (rules.custom && !rules.custom(value)) {
      return rules.errorMessage || 'Invalid value.';
    }

    return;
  };


  const validateAllFields = (): boolean => {
    let isValid = true;
    const newErrors: ValidationErrors<T> = {};

    (Object.keys(validationRules) as (keyof T)[]).forEach((field) => {
      const error = validateField(field, values[field], true, true);
      if (error) {
        isValid = false;
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return isValid;
  };


  // validate array of fields
const validateFields = (fields: readonly (keyof T)[]): boolean => {
    let isValid = true;
    const newErrors: ValidationErrors<T> = {};

    fields.forEach((field) => {
      const error = validateField(field, values[field], true, true);
      if (error) {
        isValid = false;
        newErrors[field] = error;
      }
    });

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };



  const handleChange = <K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    const error = validateField(field, value, true, false);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const resetForm = (nextValues: T = initialValues) => {
    setValues(nextValues);
    setErrors({});
    setTouched({});
  };


  return {
    values,
    errors,
    touched,
    handleChange,
    validateFields,
    validateAllFields,
    setValues,
    resetForm,
  };
};


// import { useFormValidator, REGEXS } from '@/utils/validate/simple-validate';

// const validationRules = {
//   username: { required: true, pattern: REGEXS.username, errorMessage: "Username must be 3-20 alphanumeric characters." },
//   password: { required: true, pattern: REGEXS.password, errorMessage: "Password must contain letters, numbers, and be at least 8 characters." },
// };

// const { values, errors, handleChange, validateAllFields } = useFormValidator(
//   { username: '', password: '' },
//   validationRules
// );

// // On form submit
// const handleSubmit = () => {
//   if (validateAllFields()) {
//     // proceed with form submission
//   }
// };

