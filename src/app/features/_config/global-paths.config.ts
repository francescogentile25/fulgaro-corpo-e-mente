const homeUrl: string          = '/';
const loginUrl: string         = '/app/login';
const registerUrl: string      = '/app/register';
const dashboardUrl: string     = '/app/dashboard';
const groupsUrl: string        = '/app/groups';
const athletesUrl: string      = '/app/athletes';
const schedeUrl: string        = '/app/schede';
const miaSchedaUrl: string     = '/app/la-mia-scheda';
const performanceUrl: string   = '/app/performance';
const notificationsUrl: string = '/app/notifications';
const paymentsUrl: string      = '/app/payments';

const schedeAtletaUrl = (atletaId: string): string => `${schedeUrl}/${atletaId}`;

export const globalPaths = {
  homeUrl,
  loginUrl,
  registerUrl,
  dashboardUrl,
  groupsUrl,
  athletesUrl,
  schedeUrl,
  schedeAtletaUrl,
  miaSchedaUrl,
  performanceUrl,
  notificationsUrl,
  paymentsUrl,
}
