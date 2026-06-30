// src/components/ui/RazorpayWebCheckout.tsx
//
// WebView-based Razorpay checkout — no native module required.
// Works in any Expo build (Expo Go included).
//
// Usage:
//   const rzpRef = useRef<RazorpayWebCheckoutRef>(null);
//   <RazorpayWebCheckout ref={rzpRef} />
//
//   // in your handler:
//   const result = await rzpRef.current!.open({ key, order_id, amount, currency, ... });

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';

export interface RazorpaySuccessPayment {
  razorpay_payment_id: string;
  razorpay_order_id:   string;
  razorpay_signature:  string;
}

export interface RazorpayWebCheckoutRef {
  open: (options: Record<string, any>) => Promise<RazorpaySuccessPayment>;
}

// Build the HTML page that opens Razorpay checkout
function buildHtml(options: Record<string, any>): string {
  const safeOptions = JSON.stringify(options);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, sans-serif;
    }
    .loader {
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
    .dot { display: inline-block; animation: bounce 1.2s infinite; }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40%            { transform: translateY(-8px); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <p>Opening payment&hellip;</p>
    <p style="margin-top:8px">
      <span class="dot">&#9679;</span>
      <span class="dot">&#9679;</span>
      <span class="dot">&#9679;</span>
    </p>
  </div>

  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function postMsg(type, data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
      }
    }

    var opts = ${safeOptions};

    opts.handler = function(response) {
      postMsg('success', response);
    };

    opts.modal = {
      ondismiss: function() {
        postMsg('cancel', { code: 'BAD_REQUEST_ERROR', description: 'Payment cancelled by user' });
      },
      escape: false,
      backdropclose: false,
    };

    window.onload = function() {
      try {
        var rzp = new Razorpay(opts);
        rzp.on('payment.failed', function(response) {
          postMsg('error', response.error);
        });
        rzp.open();
      } catch(e) {
        postMsg('error', { code: 'LOAD_ERROR', description: e.message || 'Failed to load Razorpay' });
      }
    };
  </script>
</body>
</html>
  `.trim();
}

// ── Component ─────────────────────────────────────────────────────
const RazorpayWebCheckout = forwardRef<RazorpayWebCheckoutRef>((_, ref) => {
  const { COLORS, FONTS } = useTheme();
  const [visible,  setVisible]  = useState(false);
  const [html,     setHtml]     = useState('');
  const [loading,  setLoading]  = useState(true);

  // Promise resolve/reject stored in refs so WebView message handler can access them
  const resolveRef = useRef<((v: RazorpaySuccessPayment) => void) | null>(null);
  const rejectRef  = useRef<((e: any) => void) | null>(null);

  useImperativeHandle(ref, () => ({
    open: (options: Record<string, any>) => {
      return new Promise<RazorpaySuccessPayment>((resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current  = reject;
        setHtml(buildHtml(options));
        setLoading(true);
        setVisible(true);
      });
    },
  }));

  const close = () => {
    setVisible(false);
    setHtml('');
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; data: any };

      if (msg.type === 'success') {
        close();
        resolveRef.current?.(msg.data as RazorpaySuccessPayment);
      } else if (msg.type === 'cancel') {
        close();
        // Resolve null to signal cancellation (hook treats this separately)
        rejectRef.current?.({ code: 'BAD_REQUEST_ERROR', description: 'Payment cancelled by user' });
      } else if (msg.type === 'error') {
        close();
        rejectRef.current?.(msg.data);
      }
    } catch {
      // ignore malformed messages
    }
  };

  const handleUserCancel = () => {
    close();
    rejectRef.current?.({ code: 'BAD_REQUEST_ERROR', description: 'Payment cancelled by user' });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleUserCancel}
      statusBarTranslucent
    >
      <SafeAreaView style={[s.safe, { backgroundColor: COLORS.background }]} edges={['top']}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: COLORS.borderLight }]}>
          <Text style={[s.title, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
            Secure Payment
          </Text>
          <TouchableOpacity onPress={handleUserCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Loading overlay */}
        {loading && (
          <View style={[s.loadingOverlay, { backgroundColor: COLORS.background }]}>
            <ActivityIndicator size="large" color="#C9A84C" />
            <Text style={[s.loadingTxt, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
              Loading payment gateway…
            </Text>
          </View>
        )}

        {/* WebView */}
        {html !== '' && (
          <WebView
            style={{ flex: 1 }}
            source={{ html, baseUrl: 'https://api.razorpay.com' }}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
});

export default RazorpayWebCheckout;

const s = StyleSheet.create({
  safe:           { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  title:          { fontSize: 16 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 10, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:     { fontSize: 13, marginTop: 8 },
});
