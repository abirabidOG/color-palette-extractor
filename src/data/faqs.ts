export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: 'How do I get a color palette from a photo?',
    answer:
      'Simply drag and drop or upload any photo, illustration, or logo (JPG, PNG, WebP, or SVG). Color Palette Extractor instantly analyzes the image in your browser using the HTML5 Canvas API and extracts 5 to 6 dominant colors, plus distinct light and dark shades. You can also click anywhere on the image to sample custom colors.',
  },
  {
    question: 'What is a HEX code?',
    answer:
      'A HEX code is a 6-character hexadecimal value (e.g., #1F8C7F) preceded by a hash symbol that represents a specific color in web design and digital graphics. It specifies the precise mix of red, green, and blue light (RGB) used by screens to display that color.',
  },
  {
    question: 'Can I use these colors in Canva?',
    answer:
      'Yes! Click on any swatch or click "Copy All HEX Codes", then open Canva, select any text, element, or background, click the color square, and paste your HEX code into the search box. It works identically in Figma, Adobe Photoshop, Illustrator, and Webflow.',
  },
  {
    question: 'Is Color Palette Extractor free?',
    answer:
      'Yes, Color Palette Extractor is 100% free with no sign-up, no subscriptions, no ads, no paywalls, and no watermarks on your downloaded palette files.',
  },
  {
    question: 'Is my photo uploaded anywhere?',
    answer:
      'No. Your photo or logo never leaves your computer or phone. All image parsing and color quantization happen entirely in your local browser memory using the client-side Canvas API. None of your image data is sent to any remote server.',
  },
];
