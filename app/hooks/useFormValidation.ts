"use client";

import { useState, useCallback, useMemo } from 'react';
import type { ZodSchema } from 'zod';
import { validateForm } from '@/lib/validation';

interface UseFormValidationOptions<T> {
  /** Zod schema for validation */
  schema: ZodSchema<T>;
  /** Initial form values */
  initialValues: T;
  /** Callback when form is successfully submitted */
  onSubmit: (data: T) => Promise<void> | void;
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
  /** Whether to validate on change */
  validateOnChange?: boolean;
}

interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  submitError: string | null;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues,
  onSubmit,
  validateOnBlur = true,
  validateOnChange = false,
}: UseFormValidationOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    submitError: null,
  });

  /**
   * Validates a single field
   */
  const validateField = useCallback(
    (name: keyof T, value: any) => {
      const result = validateForm(schema, { ...state.values, [name]: value });
      
      if (result.success) {
        setState((prev) => ({
          ...prev,
          errors: { ...prev.errors, [name as string]: '' },
        }));
        return true;
      }
      
      const fieldError = result.errors[name as string] || '';
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [name as string]: fieldError },
      }));
      return !fieldError;
    },
    [schema, state.values]
  );

  /**
   * Validates all fields
   */
  const validateAll = useCallback(() => {
    const result = validateForm(schema, state.values);
    
    if (result.success) {
      setState((prev) => ({
        ...prev,
        errors: {},
        isValid: true,
      }));
      return { success: true as const, data: result.data };
    }
    
    setState((prev) => ({
      ...prev,
      errors: result.errors,
      isValid: false,
    }));
    return { success: false as const, errors: result.errors };
  }, [schema, state.values]);

  /**
   * Handles input change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [name]: newValue },
        submitError: null,
      }));
      
      if (validateOnChange) {
        validateField(name as keyof T, newValue);
      }
    },
    [validateOnChange, validateField]
  );

  /**
   * Handles input blur
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      
      setState((prev) => ({
        ...prev,
        touched: { ...prev.touched, [name]: true },
      }));
      
      if (validateOnBlur) {
        validateField(name as keyof T, state.values[name as keyof T]);
      }
    },
    [validateOnBlur, validateField, state.values]
  );

  /**
   * Sets a field value programmatically
   */
  const setValue = useCallback((name: keyof T, value: any) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [name]: value },
    }));
  }, []);

  /**
   * Sets an error for a field
   */
  const setError = useCallback((name: keyof T, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [name as string]: error },
    }));
  }, []);

  /**
   * Sets the submit error
   */
  const setSubmitError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      submitError: error,
    }));
  }, []);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      
      // Mark all fields as touched
      const allTouched = Object.keys(state.values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setState((prev) => ({
        ...prev,
        touched: allTouched,
        isSubmitting: true,
        submitError: null,
      }));
      
      const result = validateAll();
      
      if (!result.success) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
        }));
        return;
      }
      
      try {
        await onSubmit(result.data);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          submitError: error instanceof Error ? error.message : 'An error occurred',
        }));
      } finally {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
        }));
      }
    },
    [state.values, validateAll, onSubmit]
  );

  /**
   * Resets the form to initial values
   */
  const reset = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
      submitError: null,
    });
  }, [initialValues]);

  /**
   * Gets field props for an input
   */
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name,
      value: state.values[name] ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
      'aria-invalid': state.touched[name as string] && !!state.errors[name as string],
      'aria-describedby': state.errors[name as string] ? `${String(name)}-error` : undefined,
    }),
    [state.values, state.touched, state.errors, handleChange, handleBlur]
  );

  /**
   * Gets error message for a field (only if touched)
   */
  const getFieldError = useCallback(
    (name: keyof T): string | undefined => {
      if (state.touched[name as string] && state.errors[name as string]) {
        return state.errors[name as string];
      }
      return undefined;
    },
    [state.touched, state.errors]
  );

  /**
   * Check if a field has an error
   */
  const hasError = useCallback(
    (name: keyof T): boolean => {
      return Boolean(state.touched[name as string] && state.errors[name as string]);
    },
    [state.touched, state.errors]
  );

  return {
    // State
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    submitError: state.submitError,
    
    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    
    // Utilities
    setValue,
    setError,
    setSubmitError,
    validateField,
    validateAll,
    reset,
    getFieldProps,
    getFieldError,
    hasError,
  };
}

export default useFormValidation;
