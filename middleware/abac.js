import dayjs from "dayjs";

export const policies = [
  // 1. Draft posts can ony be viewed by their owners
  ({ user, resource }) => {
    return resource.status === "draft" && resource.author === user.username;
  },

  // 2. Everyone can view published posts but only between 6 AM and 10 PM
  ({ resource, environment }) => {
    if (resource.status !== "published") return false;
    const hour = dayjs(environment.time).hour();
    return hour >= 18 && hour < 20;
  },
];

export function canAccessPost(context) {
  return policies.some((policy) => policy(context));
}
