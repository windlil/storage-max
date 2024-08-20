import MaxStorage from "../../../core";

const _localStorage = new MaxStorage(localStorage)
const _sessionStorage = new MaxStorage(sessionStorage)

export {
  _localStorage,
  _sessionStorage
}