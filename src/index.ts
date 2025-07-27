#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Tesseract from 'tesseract.js';
import Jimp from 'jimp';
import sharp from 'sharp';

interface OCRResult {
  text: string;
  confidence: number;
}

interface DetectionResult {
  boxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    confidence: number;
  }>;
}

interface SlideMatchResult {
  x: number;
  y: number;
  confidence: number;
}

class DdddocrMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'ddddocr-smithery-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'ocr_recognize',
            description: 'Perform OCR recognition on an image to extract text content using Tesseract.js',
            inputSchema: {
              type: 'object',
              properties: {
                image: {
                  type: 'string',
                  description: 'Base64 encoded image data',
                },
                language: {
                  type: 'string',
                  description: 'OCR language (eng, chi_sim, chi_tra, etc.)',
                  default: 'eng+chi_sim',
                },
                psm: {
                  type: 'number',
                  description: 'Page segmentation mode (0-13)',
                  default: 6,
                },
                whitelist: {
                  type: 'string',
                  description: 'Character whitelist for recognition',
                },
              },
              required: ['image'],
            },
          } as Tool,
          {
            name: 'text_detection',
            description: 'Detect text regions and extract text with bounding boxes',
            inputSchema: {
              type: 'object',
              properties: {
                image: {
                  type: 'string',
                  description: 'Base64 encoded image data',
                },
                language: {
                  type: 'string',
                  description: 'Detection language',
                  default: 'eng+chi_sim',
                },
              },
              required: ['image'],
            },
          } as Tool,
          {
            name: 'image_preprocessing',
            description: 'Preprocess image to improve OCR accuracy',
            inputSchema: {
              type: 'object',
              properties: {
                image: {
                  type: 'string',
                  description: 'Base64 encoded image data',
                },
                operations: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['grayscale', 'contrast', 'brightness', 'blur', 'sharpen', 'threshold']
                  },
                  description: 'Image preprocessing operations to apply',
                  default: ['grayscale', 'contrast'],
                },
                threshold: {
                  type: 'number',
                  description: 'Threshold value for binarization (0-255)',
                  default: 128,
                },
              },
              required: ['image'],
            },
          } as Tool,
          {
            name: 'slide_captcha_match',
            description: 'Find sliding position for captcha solving using template matching',
            inputSchema: {
              type: 'object',
              properties: {
                background_image: {
                  type: 'string',
                  description: 'Base64 encoded background image with gap',
                },
                piece_image: {
                  type: 'string',
                  description: 'Base64 encoded puzzle piece image',
                },
                threshold: {
                  type: 'number',
                  description: 'Matching threshold (0-1)',
                  default: 0.8,
                },
              },
              required: ['background_image', 'piece_image'],
            },
          } as Tool,
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ocr_recognize':
            return await this.handleOCR(args || {});
          case 'text_detection':
            return await this.handleTextDetection(args || {});
          case 'image_preprocessing':
            return await this.handleImagePreprocessing(args || {});
          case 'slide_captcha_match':
            return await this.handleSlideCaptchaMatch(args || {});
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  private async handleOCR(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
    const imageData = args.image as string;
    const language = (args.language as string) || 'eng+chi_sim';
    const psm = (args.psm as number) || 6;
    const whitelist = args.whitelist as string;

    // Decode base64 image
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    // Setup Tesseract options
    const options: Record<string, unknown> = {
      lang: language,
      psm: psm,
    };

    if (whitelist) {
      options.tessedit_char_whitelist = whitelist;
    }

    // Perform OCR
    const { data } = await Tesseract.recognize(imageBuffer, language);

    const result: OCRResult = {
      text: data.text.trim(),
      confidence: data.confidence / 100,
    };

    return {
      content: [
        {
          type: 'text',
          text: `OCR Recognition Result:\nText: "${result.text}"\nConfidence: ${(result.confidence * 100).toFixed(2)}%`,
        },
      ],
    };
  }

  private async handleTextDetection(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
    const imageData = args.image as string;
    const language = (args.language as string) || 'eng+chi_sim';

    const imageBuffer = Buffer.from(imageData, 'base64');

    // Use Tesseract to get detailed word-level results
    const { data } = await Tesseract.recognize(imageBuffer, language);

    const boxes = data.words
      .filter(word => word.confidence > 30) // Filter low confidence words
      .map(word => ({
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0,
        text: word.text,
        confidence: word.confidence / 100,
      }));

    const result: DetectionResult = { boxes };

    return {
      content: [
        {
          type: 'text',
          text: `Text Detection Result:\nFound ${result.boxes.length} text regions:\n${result.boxes
            .map(box => `"${box.text}" at (${box.x}, ${box.y}) ${box.width}x${box.height}, confidence: ${(box.confidence * 100).toFixed(1)}%`)
            .join('\n')}`,
        },
      ],
    };
  }

  private async handleImagePreprocessing(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
    const imageData = args.image as string;
    const operations = (args.operations as string[]) || ['grayscale', 'contrast'];
    const threshold = (args.threshold as number) || 128;

    const imageBuffer = Buffer.from(imageData, 'base64');
    
    try {
      // Use Sharp for basic preprocessing
      let processed = sharp(imageBuffer);

      for (const operation of operations) {
        switch (operation) {
          case 'grayscale':
            processed = processed.grayscale();
            break;
          case 'contrast':
            processed = processed.linear(1.5, 0); // Increase contrast
            break;
          case 'brightness':
            processed = processed.linear(1.0, 20); // Increase brightness
            break;
          case 'blur':
            processed = processed.blur(1);
            break;
          case 'sharpen':
            processed = processed.sharpen();
            break;
          case 'threshold':
            processed = processed.threshold(threshold);
            break;
        }
      }

      const processedBuffer = await processed.png().toBuffer();
      const processedBase64 = processedBuffer.toString('base64');

      return {
        content: [
          {
            type: 'text',
            text: `Image preprocessing completed.\nOperations applied: ${operations.join(', ')}\nProcessed image (base64): data:image/png;base64,${processedBase64}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Image preprocessing failed: ${error}`);
    }
  }

  private async handleSlideCaptchaMatch(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
    const backgroundImage = args.background_image as string;
    const pieceImage = args.piece_image as string;
    const threshold = (args.threshold as number) || 0.8;

    try {
      // Decode images
      const bgBuffer = Buffer.from(backgroundImage, 'base64');
      const pieceBuffer = Buffer.from(pieceImage, 'base64');

      // Load images with Jimp for template matching
      const bgImg = await Jimp.read(bgBuffer);
      const pieceImg = await Jimp.read(pieceBuffer);

      // Simple template matching algorithm
      let bestMatch = { x: 0, y: 0, confidence: 0 };
      const stepSize = 5; // Sampling step for performance

      for (let x = 0; x <= bgImg.getWidth() - pieceImg.getWidth(); x += stepSize) {
        for (let y = 0; y <= bgImg.getHeight() - pieceImg.getHeight(); y += stepSize) {
          const similarity = this.calculateImageSimilarity(bgImg, pieceImg, x, y);
          
          if (similarity > bestMatch.confidence) {
            bestMatch = { x, y, confidence: similarity };
          }
        }
      }

      const result: SlideMatchResult = bestMatch;

      if (result.confidence >= threshold) {
        return {
          content: [
            {
              type: 'text',
              text: `Slide captcha match found!\nPosition: (${result.x}, ${result.y})\nConfidence: ${(result.confidence * 100).toFixed(2)}%\nSlide distance: ${result.x}px`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `No reliable match found. Best match at (${result.x}, ${result.y}) with confidence ${(result.confidence * 100).toFixed(2)}%`,
            },
          ],
        };
      }
    } catch (error) {
      throw new Error(`Slide captcha matching failed: ${error}`);
    }
  }

  private calculateImageSimilarity(bgImg: Jimp, pieceImg: Jimp, offsetX: number, offsetY: number): number {
    let totalPixels = 0;
    let matchingPixels = 0;
    const tolerance = 30; // Color tolerance

    for (let x = 0; x < pieceImg.getWidth(); x++) {
      for (let y = 0; y < pieceImg.getHeight(); y++) {
        const bgColor = Jimp.intToRGBA(bgImg.getPixelColor(offsetX + x, offsetY + y));
        const pieceColor = Jimp.intToRGBA(pieceImg.getPixelColor(x, y));

        // Skip transparent pixels in piece
        if (pieceColor.a < 128) continue;

        totalPixels++;
        
        const rDiff = Math.abs(bgColor.r - pieceColor.r);
        const gDiff = Math.abs(bgColor.g - pieceColor.g);
        const bDiff = Math.abs(bgColor.b - pieceColor.b);

        if (rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance) {
          matchingPixels++;
        }
      }
    }

    return totalPixels > 0 ? matchingPixels / totalPixels : 0;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('ddddocr Smithery MCP server running on stdio');
  }
}

const server = new DdddocrMCPServer();
server.run().catch(console.error);
