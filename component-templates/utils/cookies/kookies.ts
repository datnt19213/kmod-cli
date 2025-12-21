import Cookies from 'js-cookie';

/**
 * @function set - Sets a cookie with the given name, value, and expiration days.
 * @function get - Gets the value of a cookie with the given name.
 * @function remove - Removes a cookie with the given name.
 * @function exists - Checks if a cookie with the given name exists.
 */
export const ck = {
  set: (name: string, value: string, days?: number) => {
    Cookies.set(name, value, {
      expires: days || 365 * 100, // Default to 100 years if not specified
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });
  },

  get: (name: string): string | undefined => {
    return Cookies.get(name);
  },

  remove: (name: string) => {
    Cookies.remove(name, {path: "/"});
  },

  
  exists: (name: string): boolean => {
    return Cookies.get(name) !== undefined;
  },
};
