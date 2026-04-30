const homeUrl: string          = '/';
const loginUrl: string         = '/app/login';
const registerUrl: string      = '/app/register';
const dashboardUrl: string     = '/app/dashboard';
const groupsUrl: string        = '/app/groups';
const athletesUrl: string      = '/app/athletes';
const schedeUrl: string        = '/app/schede';
const miaSchedaUrl: string     = '/app/la-mia-scheda';
const performanceUrl: string   = '/app/performance';
const paymentsUrl: string      = '/app/payments';
const articlesAdminUrl: string = '/app/articoli';
const articlesPublicUrl: string = '/articoli';
const raceMomentsAdminUrl: string = '/app/momenti-corsa';
const tagsAdminUrl: string         = '/app/tag';

const schedeAtletaUrl    = (atletaId: string): string => `${schedeUrl}/${atletaId}`;
const articleEditUrl     = (id: string): string => `${articlesAdminUrl}/${id}/modifica`;
const articleNewUrl      = `${articlesAdminUrl}/nuovo`;
const articlePublicUrl   = (slug: string): string => `${articlesPublicUrl}/${slug}`;

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
  paymentsUrl,
  articlesAdminUrl,
  articlesPublicUrl,
  raceMomentsAdminUrl,
  tagsAdminUrl,
  articleEditUrl,
  articleNewUrl,
  articlePublicUrl,
}
