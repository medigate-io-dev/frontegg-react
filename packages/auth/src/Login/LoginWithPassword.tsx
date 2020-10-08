import React, { ComponentType, createElement, FC, ReactElement, useEffect, useRef, useState } from 'react';
import { AuthActions, AuthState, LoginStep } from '../Api';
import {
  validateEmail,
  validateSchema,
  validatePassword,
  ErrorMessage,
  useT,
  FForm,
  FButton,
  FInput,
  FFormik,
  Icon,
} from '@frontegg/react-core';
import { useAuth } from '../hooks';
const { Formik } = FFormik;
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

const stateMapper = ({ loginState, isSSOAuth, onRedirectTo, routes }: AuthState) => ({
  ...loginState,
  isSSOAuth,
  onRedirectTo,
  routes,
});

export type LoginWithPasswordRendererProps = Omit<LoginWithPasswordProps, 'renderer'> &
  ReturnType<typeof stateMapper> &
  Pick<AuthActions, 'login' | 'preLogin'>;

export interface LoginWithPasswordProps {
  renderer?: ComponentType<LoginWithPasswordRendererProps>;
}

export const LoginWithPassword: FC<LoginWithPasswordProps> = (props) => {
  const { renderer } = props;
  const { t } = useT();
  const authState = useAuth(stateMapper);

  const {
    loading,
    step,
    error,
    isSSOAuth,
    routes,
    setLoginState,
    login,
    preLogin,
    setForgotPasswordState,
    resetLoginState,
    onRedirectTo,
  } = authState;
  const backToPreLogin = () => setLoginState({ step: LoginStep.preLogin });

  if (renderer) {
    return createElement(renderer, { ...props, ...authState });
  }
  const [passwordType, setPasswordType] = useState('text');
  const shouldDisplayPassword = !isSSOAuth || step === LoginStep.loginWithPassword;
  const shouldBackToLoginIfEmailChanged = isSSOAuth && shouldDisplayPassword;
  const validationSchema: any = { email: validateEmail(t) };
  if (shouldDisplayPassword) {
    validationSchema.password = validatePassword(t);
  }
  useEffect(() => {
    if (isSSOAuth && shouldDisplayPassword) {
      document.querySelector<HTMLInputElement>('input[name="password"]')?.focus?.();
    }
  }, [shouldDisplayPassword]);

  const labelButtonProps = (values: any) => ({
    disabled: loading,
    testId: 'forgot-password-button',
    onClick: () => {
      setForgotPasswordState({ email: values.email });
      resetLoginState();
      onRedirectTo(routes.forgetPasswordUrl);
    },
    children: t('auth.login.forgot-password'),
  });

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={validateSchema(validationSchema)}
      onSubmit={async ({ email, password }) => {
        shouldDisplayPassword ? login({ email, password }) : preLogin({ email });
      }}
    >
      {({ values }) => (
        <FForm>
          <FInput
            name='email'
            type='email'
            prefixIcon={<Icon name='checkmark' />}
            suffixIcon={<Icon name='checkmark' />}
            label={t('auth.login.email')}
            placeholder='name@example.com'
            onChange={shouldBackToLoginIfEmailChanged ? backToPreLogin : undefined}
          />

          {shouldDisplayPassword && (
            <FInput
              label={t('auth.login.password')}
              suffixIcon={passwordType === 'text' ? <Visibility /> : <VisibilityOff />}
              iconAction={() => {
                setPasswordType(passwordType === 'text' ? 'password' : 'text');
              }}
              labelButton={labelButtonProps(values)}
              type={passwordType}
              name='password'
              placeholder={t('auth.login.enter-your-password')}
              disabled={!shouldDisplayPassword}
            />
          )}

          <FButton type='submit' fullWidth variant={'primary'} loading={loading}>
            {shouldDisplayPassword ? t('auth.login.login') : t('auth.login.continue')}
          </FButton>

          <ErrorMessage separator error={error} />
        </FForm>
      )}
    </Formik>
  );
};
