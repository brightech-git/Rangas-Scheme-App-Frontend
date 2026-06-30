// src/api/endpoints.ts

export const ONBOARDING = {
  BANNERS: '/schemebanner/all',
};

export const AUTH = {
  REGISTER:                    '/user/register',
  VERIFY_OTP:                  '/user/verify-otp',
  LOGIN:                       '/user/login',
  FORGOT_PASSWORD:             '/user/forgot-password',
  RESET_PASSWORD:              '/user/reset-password',
  PROFILE:                     '/user/profile',
  GOOGLE_LOGIN:                '/google-login',
  GOOGLE_CONTACT_UPDATE:       '/request-google-contact-update',
  GOOGLE_CONTACT_VERIFY_OTP:   '/verify-google-contact-otp',
};

export const MPIN = {
  CREATE:          '/mpin/create',
  VERIFY:          '/mpin/verify',
  RESET:           '/mpin/reset',
  FORGOT_SEND_OTP: '/mpin/forgot/send-otp',
  FORGOT_VERIFY:   '/mpin/forgot/verify',
};

export const DEVICE = {
  REGISTER:    '/device/register',
  LOGOUT:      '/device/logout',
  DELETE:      '/device/delete',
};

// src/api/endpoints.ts

export const SCHEME_SLIDER = {
  ALL: '/schemeslider/all',
  UPLOAD: '/schemeslider/upload',
  UPDATE: '/schemeslider/update',
  DELETE: '/schemeslider/delete',
};

export const SCHEMES = {
  ALL: '/schemes/all',
};

export const MEMBER = {
  BY_SCHEME: '/member/schemeid',
  CREATE:    '/member/create',
};

export const ACCOUNT = {
  PHONE_DETAILS: '/account/phone_details',
  INSERT:        '/account/insert',
  TODAY_RATE:    '/account/todayrate',
  RATE_HISTORY:  '/account/rate/history',
};

export const COMPANY = {
  ALL: '/company/all',
};

export const LOGIN_CHECK = {
  REGISTER: '/logincheck/register',
  LIST:     '/logincheck/list',
};

export const RAZORPAY = {
  CREATE_ORDER:    '/razorpay/create-order',
  VERIFY_PAYMENT:  '/razorpay/verify-payment',
  PAYMENT_FAILED:  '/razorpay/payment-failed',
  REFUND:          '/razorpay/refund',
  RECEIPT:         (receipt: string) => `/razorpay/payment/receipt/${receipt}`,
};

export const USER_PROFILE = {
  GET:          (userId: number) => `/user/${userId}`,
  UPDATE:       (userId: number) => `/${userId}/update`,
  UPDATE_PHOTO: (userId: string) => `/photo/${userId}`,
  DELETE_PHOTO: (userId: string) => `/photo/${userId}`,
  DELETE_USER:  (userId: number) => `/user/delete/${userId}`,
};

export const NOTIFICATIONS = {
  // Templates
  SAVE_MESSAGE:           '/notifications/saveMessage',
  UPDATE_MESSAGE:         (id: number) => `/notifications/updateMessage/${id}`,
  DELETE_MESSAGE:         (id: number) => `/notifications/deleteMessage/${id}`,
  GET_TEMPLATE:           (id: number) => `/notifications/templates/${id}`,
  GET_ALL_TEMPLATES:      '/notifications/templates',
  GET_BY_SCHEME:          (schemeId: number) => `/notifications/scheme/${schemeId}`,

  // Send
  SEND:                   '/notifications/send',
  SEND_ALL:               '/notifications/sendAll',
  SEND_MESSAGE_TO_USER:   (messageId: number, userId: number) => `/notifications/sendMessage/${messageId}/user/${userId}`,
  SEND_MESSAGE_SCHEME:    (messageId: number, userId: number, schemeId: number) => `/notifications/sendMessage/${messageId}/user/${userId}/scheme/${schemeId}`,
  SEND_ALL_MESSAGE:       (messageId: number) => `/notifications/sendAll/${messageId}`,
  SEND_ALL_SCHEME:        (messageId: number, schemeId: number) => `/notifications/sendAll/${messageId}/scheme/${schemeId}`,

  // User notificationssugo
  GET_USER:               (userId: number) => `/notifications/user/${userId}`,
  GET_ALL:                '/notifications/all',
  DELETE_BY_USER:         (userId: number) => `/notifications/user/${userId}`,
  DELETE_ONE:             (id: number) => `/notifications/notification/${id}`,

  // Read
  UNREAD_COUNT:           (userId: number) => `/notifications/user/${userId}/unread-count`,
  MARK_READ:              (notificationId: number, userId: number) => `/notifications/read/${notificationId}/user/${userId}`,
  MARK_ALL_READ:          (userId: number) => `/notifications/read/all/${userId}`,

  // Test
  TEST_BIRTHDAY:          (userId: number) => `/notifications/test/birthday/${userId}`,
  TEST_ANNIVERSARY:       (userId: number) => `/notifications/test/anniversary/${userId}`,
};