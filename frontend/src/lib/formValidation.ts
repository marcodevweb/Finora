import React from 'react';

export const validateForm = (
  event: React.FormEvent<HTMLFormElement>,
  showMessage: (message: string) => void,
) => {
  const form = event.currentTarget;
  if (form.checkValidity()) return true;

  const invalidField = form.querySelector<HTMLElement>(':invalid');
  invalidField?.focus();
  showMessage('Confira os campos obrigatórios e os valores informados.');
  return false;
};
