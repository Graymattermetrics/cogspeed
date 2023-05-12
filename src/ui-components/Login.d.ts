/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, PasswordFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
export declare type ValidationResponse = {
  hasError: boolean;
  errorMessage?: string;
};
export declare type ValidationFunction<T> = (
  value: T,
  validationResponse: ValidationResponse
) => ValidationResponse | Promise<ValidationResponse>;
export declare type LoginInputValues = {
  email?: string;
  password?: string;
};
export declare type LoginValidationValues = {
  email?: ValidationFunction<string>;
  password?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type LoginOverridesProps = {
  LoginGrid?: PrimitiveOverrideProps<GridProps>;
  email?: PrimitiveOverrideProps<TextFieldProps>;
  password?: PrimitiveOverrideProps<PasswordFieldProps>;
} & EscapeHatchProps;
export declare type LoginProps = React.PropsWithChildren<
  {
    overrides?: LoginOverridesProps | undefined | null;
  } & {
    onSubmit: (fields: LoginInputValues) => void;
    onChange?: (fields: LoginInputValues) => LoginInputValues;
    onValidate?: LoginValidationValues;
  } & React.CSSProperties
>;
export default function Login(props: LoginProps): React.ReactElement;
