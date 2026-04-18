
import { VoiceOption } from './types';

export const AVAILABLE_VOICES: VoiceOption[] = [
  { id: 'v-north-male-news', name: 'Nam Miền Bắc [Thời sự - Chính luận]' },
  { id: 'v-north-female-news', name: 'Nữ Miền Bắc [Thời sự - Trang trọng]' },
  { id: 'v-south-male-news', name: 'Nam Miền Nam [Thời sự - Thuyết minh]' },
  { id: 'v-south-female-news', name: 'Nữ Miền Nam [Thời sự - Truyền cảm]' },
  { id: 'v-north-male-story', name: 'Nam Miền Bắc [Kể chuyện đêm khuya]' },
  { id: 'v-north-female-story', name: 'Nữ Miền Bắc [Kể chuyện - Truyền cảm]' },
  { id: 'v-south-male-story', name: 'Nam Miền Nam [Kể chuyện - Trầm ấm]' },
  { id: 'v-south-female-story', name: 'Nữ Miền Nam [Kể chuyện - Dịu dàng]' },
  { id: 'v-north-male-sports', name: 'Nam Miền Bắc [Bình luận Thể thao]' },
  { id: 'v-south-male-sports', name: 'Nam Miền Nam [Bình luận Thể thao]' },
  { id: 'v-north-female-review', name: 'Nữ Miền Bắc [Review Phim - Trẻ trung]' },
  { id: 'v-south-female-ads', name: 'Nữ Miền Nam [Quảng cáo - Năng động]' },
  { id: 'v-north-male-warm', name: 'Nam Miền Bắc [Podcast - Trầm ấm]' },
  { id: 'v-south-female-gentle', name: 'Nữ Miền Nam [Phát thanh - Nhẹ nhàng]' },
  { id: 'v-north-male-strong', name: 'Nam Miền Bắc [Mạnh mẽ - Quyền lực]' },
];

export const HISTORY_STORAGE_KEY = 'tts-generation-history';
export const MAX_HISTORY_ITEMS = 10;

export const ATTIRE_GROUPS = [
  {
    title: 'CƠ BẢN / NAM',
    options: ['GIỮ NGUYÊN', 'SƠ MI', 'SƠ MI TRẮNG', 'POLO', 'PHÔNG TRƠN', 'ÁO THUN', 'ÁO KHOÁC', 'VEST', 'SUIT NAM', 'ÁO COMLE', 'TÙY CHỈNH']
  },
  {
    title: 'NỮ / TRUYỀN THỐNG',
    options: ['VÁY CÔNG SỞ', 'VEST NỮ 1', 'VEST NỮ 2', 'ÁO BẦU NỮ', 'ÁO DÀI TRẮNG', 'ÁO DÀI NAM', 'ÁO BÀ BA']
  },
  {
    title: 'HỌC ĐƯỜNG',
    options: ['KHĂN QUÀNG ĐỎ', 'NỮ SINH HQ 1', 'NỮ SINH HQ 2', 'NỮ SINH HQ 3']
  }
];

export const HAIRSTYLE_GROUPS = [
  { title: 'CƠ BẢN', options: ['GIỮ NGUYÊN', 'GỌN GÀNG', 'THỜI TRANG'] },
  { title: 'KIỂU NỮ', options: ['TÓC NGẮN', 'TÓC DÀI', 'BÚI BỒNG BỀNH', 'BUỘC GỌN'] },
  { title: 'KIỂU NAM', options: ['TEXTURE CROP', 'SIDE PART HQ', 'XOĂN NGẮN', 'HẠT DẺ NGÕ'] },
  { title: 'MÀU TÓC', options: ['ĐEN', 'NÂU', 'VÀNG', 'BẠCH KIM'] }
];
