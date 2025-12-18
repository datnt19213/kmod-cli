import { useState } from 'react';

export const REGEXS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[0-9]{10,11}$/,
  url: /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*(\?.*)?$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
  postalCode: /^[0-9]{5,6}$/,
  number: /^\d+$/,
  decimal: /^\d+(\.\d{1,2})?$/,
  name: /^[a-zA-ZÀ-ỹ\s]{1,50}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
};

interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  minLength?: number;
  maxLength?: number;
  errorMessage?: string;
}

type ValidationRules<T> = {
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

  const handleChange = <K extends keyof T>(field: K, value: T[K]) => {
    setValues({...values, [field]: value});
    const error = validateField(field, value);
    setErrors({...errors, [field]: error});
  };

  return {
    values,
    errors,
    handleChange,
    validateAllFields,
    setValues,
  };
};
