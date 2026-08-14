/** @deprecated Import from `@/lib/validators/customer` */
export {
  customerFormSchema,
  emptyCustomerFormValues,
  parseCustomerFormValues,
  type CustomerFormValues,
} from "@/lib/validators/customer";

import {
  parseCustomerFormValues,
  type CustomerFormValues,
} from "@/lib/validators/customer";

export type GstCustomerFormValues = CustomerFormValues;

export function validateGstCustomerForm(values: CustomerFormValues) {
  return parseCustomerFormValues(values);
}
