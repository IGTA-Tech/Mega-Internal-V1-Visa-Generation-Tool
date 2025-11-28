declare module 'api2pdf' {
  export default class Api2Pdf {
    constructor(apiKey: string);
    headlessChrome: {
      htmlToPdf(html: string, options?: any): Promise<{ pdf: string; success: boolean }>;
    };
  }
}
