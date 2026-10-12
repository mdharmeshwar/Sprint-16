export const appStore = {
  token: localStorage.getItem('taskmatrix_token') || '',
};

export default appStore;
