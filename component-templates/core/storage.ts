export type CookieSet = {
  name: string;
  value: string | object;
  days?: number | "infinity";
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
};

export type SessionSet<T> = {
  key: string;
  value: T;
  expiresMs?: number | boolean;
};

export type SessionGet<T> = {
  key: string;
  expiredCheck?: boolean;
};
export type SessionGetHas = {
  key: string;
  expiredCheck?: boolean;
};

export class Storage {
  private static prefix = "app_";

  // ------------------- Set Prefix -------------------
  static setPrefix(prefix: string) {
    this.prefix = prefix;
  }

  // ------------------- LocalStorage -------------------
  static setItem<T>({
    key,
    value,
    expiresMs = false,
  }: {
    key: string;
    value: T;
    expiresMs?: number | boolean;
  }) {
    const item =
      typeof expiresMs === "number"
        ? {
            value,
            expires: expiresMs ? Date.now() + expiresMs : null,
          }
        : value;
    localStorage.setItem(this.prefix + key, JSON.stringify(item));
  }

  static getItem<T>({
    key,
    expiredCheck = false,
  }: {
    key: string;
    expiredCheck?: boolean;
  }): T | null {
    const itemStr = localStorage.getItem(this.prefix + key);
    if (!itemStr) return null;
    try {
      const item = JSON.parse(itemStr);
      if (expiredCheck === false) return item.value;
      if (item.expires && Date.now() > item.expires) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      return item.value;
    } catch {
      localStorage.removeItem(this.prefix + key);
      return null;
    }
  }

  static removeItem(key: string) {
    localStorage.removeItem(this.prefix + key);
  }

  static clearStorage() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => localStorage.removeItem(key));
  }

  static hasItem({
    key,
    expiredCheck = false,
  }: {
    key: string;
    expiredCheck?: boolean;
  }): boolean {
    return this.getItem({ key, expiredCheck }) !== null;
  }

  // ------------------- Cookies -------------------
  /**
   * Sets a cookie.
   * @param name - The name of the cookie.
   * @param value - The value of the cookie.
   * @param days - The number of days until the cookie expires.
   * @param path - The path of the cookie.
   * @param sameSite - The SameSite attribute of the cookie. Defaults to "Lax".
   */
  static setCookie({
    name,
    value,
    days,
    path = "/",
    sameSite = "Lax",
  }: CookieSet) {
    let val = typeof value === "object" ? JSON.stringify(value) : value;
    let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(
      val
    )}; path=${path}; SameSite=${sameSite}`;
    if (days === "infinity") cookieStr += "; max-age=3153600000";
    if (days && days !== "infinity") {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      cookieStr += `; expires=${expires.toUTCString()}`;
    }
    if (location.protocol === "https:") cookieStr += "; Secure";
    document.cookie = cookieStr;
  }

  /**
   * Retrieves a cookie value by name.
   * @param name The name of the cookie.
   * @returns The value of the cookie, or undefined if it does not exist.
   * The value is parsed as JSON if it is a valid JSON string; otherwise it is
   * returned as a string.
   */
  static getCookie<T = string>(name: string): T | undefined {
    const nameEQ = encodeURIComponent(name) + "=";
    const ca = document.cookie.split(";").map((c) => c.trim());
    for (let c of ca) {
      if (c.indexOf(nameEQ) === 0) {
        const val = decodeURIComponent(c.substring(nameEQ.length));
        try {
          return JSON.parse(val) as T;
        } catch {
          return val as unknown as T;
        }
      }
    }
    return undefined;
  }

  /**
   * Removes a cookie by name.
   * @param name The name of the cookie to remove.
   * @param path The path of the cookie to remove; defaults to "/".
   */
  static removeCookie(name: string, path = "/") {
    document.cookie = `${encodeURIComponent(
      name
    )}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  /**
   * Checks if a cookie with the given name exists.
   * @param name The name of the cookie to check.
   * @returns true if the cookie exists, false otherwise.
   */
  static cookieExists(name: string): boolean {
    return this.getCookie(name) !== undefined;
  }

  //------------------- Session Storage -------------------
  static setSessionItem<T>({ key, value, expiresMs = false }: SessionSet<T>) {
    const item =
      typeof expiresMs === "number"
        ? {
            value,
            expires: expiresMs ? Date.now() + expiresMs : null,
          }
        : value;
    sessionStorage.setItem(this.prefix + key, JSON.stringify(item));
  }

  static getSessionItem<T>({
    key,
    expiredCheck = false,
  }: SessionGet<T>): T | null {
    const itemStr = sessionStorage.getItem(this.prefix + key);
    if (!itemStr) return null;
    try {
      const item = JSON.parse(itemStr);
      if (expiredCheck === false) return item.value;
      if (item.expires && Date.now() > item.expires) {
        sessionStorage.removeItem(this.prefix + key);
        return null;
      }
      return item.value;
    } catch {
      sessionStorage.removeItem(this.prefix + key);
      return null;
    }
  }

  static removeSessionItem(key: string) {
    sessionStorage.removeItem(this.prefix + key);
  }

  static clearSession() {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => sessionStorage.removeItem(key));
  }

  static hasSessionItem({ key, expiredCheck = false }: SessionGetHas): boolean {
    return this.getSessionItem({ key, expiredCheck }) !== null;
  }
}
