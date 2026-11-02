export const logger = {
  info: (...messages) => console.log(new Date().toISOString(), 'INFO', ...messages),
  error: (...messages) => console.error(new Date().toISOString(), 'ERROR', ...messages),
};
