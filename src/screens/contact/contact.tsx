// src/screens/contact/contact.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { IMAGE_BASE_URL } from '@env';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import { useTheme } from '../../theme';
import PoweredByFooter from '../../components/ui/PoweredByFooter';
import { useCompanies } from '../../api/hooks/Company/useCompanies';
import { Company } from '../../types/Company/Company';

const fallbackLogo = require('../../assets/company/logo.png');
const FALLBACK_WEBSITE = 'www.rangasjewellery.com';

type Branch = { label: string; lines: string[]; mapsQuery: string };

type SocialLink = { icon: keyof typeof Ionicons.glyphMap; url: string };

const buildBranches = (c: Company): Branch[] => {
  const lines1 = [c.ADDRESS1, c.ADDRESS2].map(x => (x ?? '').trim()).filter(Boolean);
  const lines2 = [c.ADDRESS3, c.ADDRESS4].map(x => (x ?? '').trim()).filter(Boolean);
  const out: Branch[] = [];
  if (lines1.length) out.push({ label: 'Branch 1', lines: lines1, mapsQuery: `${c.COMPANYNAME} ${lines1.join(', ')}` });
  if (lines2.length) out.push({ label: 'Branch 2', lines: lines2, mapsQuery: `${c.COMPANYNAME} ${lines2.join(', ')}` });
  return out;
};

const buildPhones = (phone: string) =>
  phone.split(/[,/]/).map(p => p.trim()).filter(Boolean);

const buildSocialLinks = (c: Company): SocialLink[] => {
  const links: SocialLink[] = [];
  if (c.WHATSAPPLINK)       links.push({ icon: 'logo-whatsapp',  url: c.WHATSAPPLINK });
  if (c.FACEBOOKLINK)       links.push({ icon: 'logo-facebook',  url: c.FACEBOOKLINK });
  if (c.INSTALINK)          links.push({ icon: 'logo-instagram', url: c.INSTALINK });
  if (c.TWITTERLINK)        links.push({ icon: 'logo-twitter',   url: c.TWITTERLINK });
  if (c.YOUTUBELINK)        links.push({ icon: 'logo-youtube',   url: c.YOUTUBELINK });
  if (c.GOOGLEBUSINESSLINK) links.push({ icon: 'logo-google',    url: c.GOOGLEBUSINESSLINK });
  if (c.APPSTORELINK)       links.push({ icon: 'logo-apple-appstore', url: c.APPSTORELINK });
  if (c.ANDROIDLINK)        links.push({ icon: 'logo-google-playstore', url: c.ANDROIDLINK });
  return links;
};

const mapsHref = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export default function ContactScreen() {
  const { COLORS, FONTS, SIZES } = useTheme();
  const navigation = useNavigation<any>();
  const { companies, loading, error } = useCompanies();

  return (
    <>
      <AppHeader title="Contact" showBack onBackPress={() => navigation.navigate('Home')} variant="primary" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingHorizontal: 16 }]}>

        {loading && <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>}
        {!loading && error && companies.length === 0 && (
          <Text style={[s.errorTxt, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
            Unable to load company details.
          </Text>
        )}

        {!loading && companies.map((c) => {
          const branches = buildBranches(c);
          const social = buildSocialLinks(c);
          const logoUri = c.LOGO ? `${IMAGE_BASE_URL}${c.LOGO}` : null;
          const website = c.BASEURL?.trim() || FALLBACK_WEBSITE;

          return (
            <View key={c.COMPANYID}>

              {/* ── Logo ── */}
              <View style={[s.logoCircle, { backgroundColor: COLORS.card, borderColor: COLORS.borderLight }]}>
                <Image source={logoUri ? { uri: logoUri } : fallbackLogo} style={s.logo} resizeMode="contain" />
              </View>

              {/* Company name */}
              <Text style={[s.companyName, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold }]}>
                {c.COMPANYNAME}
              </Text>

              {/* Phone — each number on its own row */}
              {!!c.PHONE && buildPhones(c.PHONE).map((num, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.row}
                  onPress={() => Linking.openURL(`tel:${num.replace(/[^0-9+]/g, '')}`)}
                  activeOpacity={0.7}
                >
                  <View style={[s.rowIcon, { backgroundColor: COLORS.primary + '12' }]}>
                    <Ionicons name="call-outline" size={15} color={COLORS.primary} />
                  </View>
                  <View style={s.rowBody}>
                    <Text style={[s.rowLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                      {i === 0 ? 'Phone' : `Phone ${i + 1}`}
                    </Text>
                    <Text style={[s.rowValue, { color: COLORS.primary, fontFamily: FONTS.family.semiBold }]}>{num}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.textTertiary} />
                </TouchableOpacity>
              ))}

              {/* Email */}
              {!!c.EMAIL && (
                <TouchableOpacity style={s.row} onPress={() => Linking.openURL(`mailto:${c.EMAIL}`)} activeOpacity={0.7}>
                  <View style={[s.rowIcon, { backgroundColor: COLORS.primary + '12' }]}>
                    <Ionicons name="mail-outline" size={15} color={COLORS.primary} />
                  </View>
                  <View style={s.rowBody}>
                    <Text style={[s.rowLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Email</Text>
                    <Text style={[s.rowValue, { color: COLORS.primary, fontFamily: FONTS.family.semiBold }]} numberOfLines={1}>{c.EMAIL}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}

              {/* Website — falls back to the known company site when BASEURL isn't set */}
              <TouchableOpacity
                style={s.row}
                onPress={() => Linking.openURL(/^https?:\/\//i.test(website) ? website : `https://${website}`)}
                activeOpacity={0.7}
              >
                <View style={[s.rowIcon, { backgroundColor: COLORS.primary + '12' }]}>
                  <Ionicons name="globe-outline" size={15} color={COLORS.primary} />
                </View>
                <View style={s.rowBody}>
                  <Text style={[s.rowLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Website</Text>
                  <Text style={[s.rowValue, { color: COLORS.primary, fontFamily: FONTS.family.semiBold }]} numberOfLines={1}>{website}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textTertiary} />
              </TouchableOpacity>

              {/* Timings */}
              {!!c.TIMINGS?.trim() && (
                <View style={s.row}>
                  <View style={[s.rowIcon, { backgroundColor: COLORS.primary + '12' }]}>
                    <Ionicons name="time-outline" size={15} color={COLORS.primary} />
                  </View>
                  <View style={s.rowBody}>
                    <Text style={[s.rowLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Working Hours</Text>
                    <Text style={[s.rowValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{c.TIMINGS}</Text>
                  </View>
                </View>
              )}

              {/* GST No. */}
              {!!c.GSTNO?.trim() && (
                <View style={s.row}>
                  <View style={[s.rowIcon, { backgroundColor: COLORS.primary + '12' }]}>
                    <Ionicons name="document-text-outline" size={15} color={COLORS.primary} />
                  </View>
                  <View style={s.rowBody}>
                    <Text style={[s.rowLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>GST No.</Text>
                    <Text style={[s.rowValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{c.GSTNO}</Text>
                  </View>
                </View>
              )}

              {/* Branch addresses */}
              {branches.map((b, i) => (
                <TouchableOpacity key={i} style={[s.row, s.rowTop]} onPress={() => Linking.openURL(mapsHref(b.mapsQuery))} activeOpacity={0.7}>
                  <View style={[s.rowIcon, { backgroundColor: COLORS.primary + '12' }]}>
                    <Ionicons name="location-outline" size={15} color={COLORS.primary} />
                  </View>
                  <View style={s.rowBody}>
                    <Text style={[s.rowLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>{b.label}</Text>
                    {b.lines.map((line, li) => (
                      <Text key={li} style={[s.rowValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.medium }]}>{line}</Text>
                    ))}
                    <Text style={[s.mapsLink, { color: COLORS.primary, fontFamily: FONTS.family.medium }]}>Open in Maps →</Text>
                  </View>
                  <Ionicons name="navigate-outline" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              ))}

              {/* Social / store links */}
              {social.length > 0 && (
                <View style={s.socialRow}>
                  {social.map((link, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[s.socialBtn, { backgroundColor: COLORS.primary + '12' }]}
                      onPress={() => Linking.openURL(link.url)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={link.icon} size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <PoweredByFooter />
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  content:     { paddingTop: 16, paddingBottom: 100 },
  // logo
  logoCircle:  { width: 250, height: 90, borderRadius: 14, borderWidth: 1, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden', padding: 2 },
  logo:        { width: '100%', height: '100%' },
  companyName: { fontSize: 17, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  // rows
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rowTop:      { alignItems: 'flex-start' },
  rowIcon:     { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowBody:     { flex: 1 },
  rowLabel:    { fontSize: 10, marginBottom: 1 },
  rowValue:    { fontSize: 13, lineHeight: 18 },
  mapsLink:    { fontSize: 11, marginTop: 3 },
  // social
  socialRow:   { flexDirection: 'row', gap: 12, marginTop: 12, justifyContent: 'center' },
  socialBtn:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  // misc
  center:      { paddingVertical: 24, alignItems: 'center' },
  errorTxt:    { fontSize: 13, textAlign: 'center', marginVertical: 12 },
});
