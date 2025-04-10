import dayjs from "dayjs";

export const policies = [
  // 1. Author can access their own drafts
  ({ user, resource }) => {
    return resource.status === "draft" && resource.authorId === user.id;
  },

  // 2. Editors and admins can access drafts
  ({ user, resource }) => {
    return (
      resource.status === "draft" && ["editor", "admin"].includes(user.role)
    );
  },

  // 3. Everyone can read published posts
  ({ resource }) => {
    return resource.status === "published";
  },

  // 4. Published posts are only available between 6 AM and 10 PM
  ({ resource, environment }) => {
    if (resource.status !== "published") return false;
    const hour = dayjs(environment.time).hour();
    return hour >= 6 && hour < 22;
  },

  // 5. Admins can access archived posts from any IP
  ({ user, resource }) => {
    return resource.status === "archived" && user.role === "admin";
  },

  // 6. Restrict IP-based access (e.g., local network only)
  ({ environment }) => {
    const ip = environment.ip;
    return ip.startsWith("192.168."); // e.g., local network
  },
];
