

export interface UploadProgress {
  loaded: number;
  total: number;
}

export class GeminiClient {
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async uploadFile(
    file: File,
    mimeType: string = "video/mp4",
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // 1. Start Resumable Upload
    const initUrl = `${this.baseUrl}/upload/v1beta/files?key=${this.apiKey}`;
    const initHeaders = {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": file.size.toString(),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    };

    const initResponse = await fetch(initUrl, {
      method: "POST",
      headers: initHeaders,
      body: JSON.stringify({ display_name: file.name }),
    });

    if (!initResponse.ok) {
      throw new Error(`Failed to initialize upload: ${initResponse.statusText}`);
    }

    const uploadUrl = initResponse.headers.get("X-Goog-Upload-URL");
    if (!uploadUrl) {
      throw new Error("Failed to get upload URL");
    }

    // 2. Upload File Content (using XMLHttpRequest for progress)
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);
      xhr.setRequestHeader("X-Goog-Upload-Protocol", "resumable");
      xhr.setRequestHeader("X-Goog-Upload-Command", "upload, finalize");
      xhr.setRequestHeader("X-Goog-Upload-Offset", "0");
      xhr.setRequestHeader("Content-Length", file.size.toString());

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({ loaded: event.loaded, total: event.total });
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          const fileUri = response.file.uri;
          // Wait for processing to complete
          try {
            await this.waitForProcessing(response.file.name); // name is like files/xxx
            resolve(fileUri);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });
  }

  async waitForProcessing(fileName: string): Promise<void> {
    let state = "PROCESSING";
    while (state === "PROCESSING") {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const url = `${this.baseUrl}/v1beta/${fileName}?key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      state = data.state;
      if (state === "FAILED") {
        throw new Error("Video processing failed on Gemini side.");
      }
    }
  }

  async generateContent(
    model: string,
    prompt: string,
    fileUri?: string
  ): Promise<string> {
    const url = `${this.baseUrl}/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents = [
      {
        parts: [
          ...(fileUri ? [{ file_data: { mime_type: "video/mp4", file_uri: fileUri } }] : []),
          { text: prompt }
        ]
      }
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Generation failed: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}
