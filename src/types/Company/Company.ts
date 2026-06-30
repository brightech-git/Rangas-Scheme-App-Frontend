// src/types/Company/Company.ts
//
// Shape of an item returned by GET /api/v1/company/all (raw uppercase keys).

export interface Company {
  COMPANYID:    string;
  COMPANYNAME:  string;
  COSTID?:      string;
  ADDRESS1?:    string;
  ADDRESS2?:    string;
  ADDRESS3?:    string;
  ADDRESS4?:    string;
  AREACODE?:    string;
  PHONE?:       string;
  EMAIL?:       string;
  LOCALTAXNO?:  string;
  CSTNO?:       string;
  TINNO?:       string;
  PANNO?:       string;
  TDSNO?:       string;
  DISPLAYORDER?: number;

  // Branding + social / store links
  LOGO?:               string;
  WHATSAPPLINK?:       string;
  TWITTERLINK?:        string;
  FACEBOOKLINK?:       string;
  APPSTORELINK?:       string;
  ANDROIDLINK?:        string;
  INSTALINK?:          string;
  YOUTUBELINK?:        string;
  GOOGLEBUSINESSLINK?: string;
}
