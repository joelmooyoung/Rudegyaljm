import loginHandler from "./login.js";

export default async function handler(req, res) {
  // Delegate to the main database-backed login endpoint to avoid hardcoded accounts
  return loginHandler(req, res);
}
