// declare module 'react-native-razorpay' {
//   export interface RazorpayOptions {
//     key:          string;
//     amount:       number;
//     currency?:    string;
//     order_id?:    string;
//     name?:        string;
//     description?: string;
//     image?:       string;
//     prefill?: {
//       name?:    string;
//       email?:   string;
//       contact?: string;
//     };
//     theme?: {
//       color?: string;
//     };
//     [key: string]: any;
//   }

//   export interface RazorpaySuccessResponse {
//     razorpay_payment_id: string;
//     razorpay_order_id:   string;
//     razorpay_signature:  string;
//   }

//   export interface RazorpayErrorResponse {
//     code:        string;
//     description: string;
//     source:      string;
//     step:        string;
//     reason:      string;
//     metadata?: {
//       payment_id?: string;
//       order_id?:   string;
//     };
//   }

//   const RazorpayCheckout: {
//     open: (options: RazorpayOptions) => Promise<RazorpaySuccessResponse>;
//   };

//   export default RazorpayCheckout;
// }
