import dayjs from "dayjs";

export const policies = [
  // 1. Author can ony access their own posts
  ({ user, resource }) => {
    return resource.status === "draft" && resource.authorId === user.id;
  },

  // 2. Everyone can view published posts but only between 6 AM and 10 PM
  ({ resource, environment }) => {
    if (resource.status !== "published") return false;
    const hour = dayjs(environment.time).hour();
    return hour >= 6 && hour < 22;
  },
];

export function canAccessPost(context) {
  return policies.some((policy) => policy(context));
}
