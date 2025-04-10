import { policies } from "./policies.js";

export function canAccessPost(context) {
  return policies.some((policy) => policy(context));
}
