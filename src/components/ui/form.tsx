"use client"

import * as React from "react"
import { 
  useForm,
  useFormContext, 
  FormProvider, 
  UseFormReturn,
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues
} from "react-hook-form"
import { cn } from '@/lib/utils/generalUtils'
import { Label } from "./label"

interface FormProps<TFieldValues extends FieldValues> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'children'> {
  form: UseFormReturn<TFieldValues>
  children?: React.ReactNode
}

const Form = <TFieldValues extends FieldValues>({
  form,
  className,
  onSubmit,
  children,
  ...props
}: FormProps<TFieldValues>) => (
  <FormProvider {...form}>
    <form
      className={cn("space-y-5", className)}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </form>
  </FormProvider>
)

Form.displayName = "Form"

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1.5", className)} {...props} />
  )
)
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <Label
      ref={ref}
      className={cn("", className)}
      {...props}
    />
  )
)
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => (
    <div ref={ref} {...props} />
  )
)
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-base text-muted-foreground", className)}
      {...props}
    />
  )
)
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement> & { name?: string }>(
  ({ className, children, name, ...props }, ref) => {
    const formContext = useFormContext()
    const fieldName = name || (props.id as string)
    
    // Return early if no form context or fieldName
    if (!formContext || !fieldName) {
      return children ? (
        <p
          ref={ref}
          className={cn("text-base font-medium text-red-500", className)}
          {...props}
        >
          {children}
        </p>
      ) : null
    }
    
    const error = formContext.formState.errors[fieldName]

    if (!error && !children) return null

    return (
      <p
        ref={ref}
        className={cn("text-base font-medium text-red-500", className)}
        {...props}
      >
        {error?.message as React.ReactNode || children}
      </p>
    )
  }
)
FormMessage.displayName = "FormMessage"

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
  control?: UseFormReturn<TFieldValues>["control"]
  render: (props: {
    field: any
    fieldState: any
    formState: any
  }) => React.ReactElement
}

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, control, render }: FormFieldProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>()
  const controlToUse = control || formContext?.control

  if (!controlToUse) {
    return (
      <FormFieldContext.Provider value={{ name }}>
        {render({
          field: { name, value: "", onChange: () => {}, onBlur: () => {}, ref: () => {} },
          fieldState: { invalid: false, error: undefined, isDirty: false },
          formState: { isDirty: false, isSubmitting: false, isValid: false }
        })}
      </FormFieldContext.Provider>
    )
  }

  return (
    <FormFieldContext.Provider value={{ name }}>
      <Controller
        control={controlToUse}
        name={name}
        render={({ field, fieldState, formState }) => {
          return render({ field, fieldState, formState })
        }}
      />
    </FormFieldContext.Provider>
  )
}

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField
} 