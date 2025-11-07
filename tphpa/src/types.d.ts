declare module 'swiper/modules' {
  export const Navigation: any;
  export const Pagination: any;
  export const Autoplay: any;
  export const A11y: any;
}

declare module 'swiper/core' {
  export const SwiperCore: any;
  export function use(modules: any[]): void;
}

declare module 'swiper/types' {
  export interface SwiperOptions {
    slidesPerView?: number;
    spaceBetween?: number;
    navigation?: boolean;
    pagination?: { clickable?: boolean };
    autoplay?: { delay?: number; disableOnInteraction?: boolean; pauseOnMouseEnter?: boolean };
    loop?: boolean;
    breakpoints?: any;
  }
}

declare module 'swiper' {
  export const SwiperCore: any;
  export function use(modules: any[]): void;
  export const Navigation: any;
  export const Pagination: any;
  export const Autoplay: any;
  export const A11y: any;
  export default class Swiper {
    constructor(element: any, options?: any);
  }
}

// Minimal ambient declarations for the Angular adapter to satisfy TS in-editor checks
declare module 'swiper/angular' {
  // SwiperModule is an NgModule exported by the adapter
  export const SwiperModule: any;
  // Components and directives used in templates
  export const SwiperComponent: any;
  export const SwiperSlideComponent: any;
  export const swiper: any;
  export const Swiper: any;
  export const SwiperSlide: any;
  export default SwiperModule;
}
