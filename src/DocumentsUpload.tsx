import React, { useState } from "react";
import {
  Upload,
  FileText,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [pdfDoc, setPdfDoc] = useState(null);

  // Load PDF.js
  const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const checkIfPasswordProtected = async (file) => {
    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();

      try {
        // Try to load PDF without password
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        return false; // Not password protected
      } catch (error) {
        // Check if the error is due to password protection
        if (
          error.name === "PasswordException" ||
          error.message.includes("password") ||
          error.message.includes("encrypted")
        ) {
          return true; // Password protected
        } else {
          throw error; // Other error
        }
      }
    } catch (error) {
      throw new Error(`Failed to read PDF: ${error.message}`);
    }
  };

  const processPdfWithPassword = async (file, password = "") => {
    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password,
      });

      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      return pdf;
    } catch (error) {
      if (error.name === "PasswordException") {
        throw new Error("Incorrect password");
      } else {
        throw new Error(`Failed to process PDF: ${error.message}`);
      }
    }
  };

  const extractTextFromPdf = async (pdf) => {
    let fullText = "";
    const numPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= Math.min(numPages, 3); pageNum++) {
      // Extract first 3 pages
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
      } catch (error) {
        fullText += `--- Page ${pageNum} ---\nError extracting text: ${error.message}\n\n`;
      }
    }

    return fullText || "No text content found in PDF";
  };

  const processDocument = async (file, password = "") => {
    setIsProcessing(true);
    setStatus("Processing PDF...");

    try {
      let pdf;

      if (isPasswordProtected) {
        if (!password) {
          throw new Error("Password is required");
        }
        pdf = await processPdfWithPassword(file, password);
      } else {
        pdf = pdfDoc; // Use already loaded PDF
      }

      setStatus("Extracting text from PDF...");
      const extractedText = await extractTextFromPdf(pdf);

      const documentInfo = `Document: ${file.name}
Size: ${(file.size / 1024).toFixed(2)} KB
Pages: ${pdf.numPages}
${
  isPasswordProtected
    ? "Status: Password verified and decrypted"
    : "Status: No password protection"
}

--- Extracted Text ---
${extractedText}`;

      setDocumentContent(documentInfo);
      setStatus("PDF processed successfully!");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setDocumentContent("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      setStatus("Error: Please select a PDF file only");
      return;
    }

    setFile(selectedFile);
    setPassword("");
    setDocumentContent("");
    setPdfDoc(null);
    setStatus("Checking PDF...");

    try {
      const isProtected = await checkIfPasswordProtected(selectedFile);
      setIsPasswordProtected(isProtected);

      if (isProtected) {
        setStatus("PDF is password protected. Please enter the password.");
      } else {
        await processDocument(selectedFile);
      }
    } catch (error) {
      setStatus(`Error reading PDF: ${error.message}`);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (file && password.trim()) {
      processDocument(file, password.trim());
    }
  };

  const resetUpload = () => {
    setFile(null);
    setIsPasswordProtected(false);
    setPassword("");
    setStatus("");
    setDocumentContent("");
    setIsProcessing(false);
    setPdfDoc(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6" />
        PDF Upload & Password Handler
      </h2>

      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <label className="cursor-pointer">
            <span className="text-lg font-medium text-gray-700 hover:text-blue-600">
              Click to upload PDF
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">
            PDF files only - supports password-protected PDFs
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              {isPasswordProtected && (
                <Lock className="w-5 h-5 text-orange-500" />
              )}
            </div>
            <button
              onClick={resetUpload}
              className="text-gray-500 hover:text-red-600 text-sm"
            >
              Remove
            </button>
          </div>

          {isPasswordProtected && !documentContent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Password Protected PDF
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter PDF password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  disabled={isProcessing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password.trim()) {
                      handlePasswordSubmit(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <button
                onClick={handlePasswordSubmit}
                disabled={!password.trim() || isProcessing}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  "Process PDF"
                )}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Enter the actual password for your PDF
              </p>
            </div>
          )}

          {status && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                status.includes("Error")
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : status.includes("successfully")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {status.includes("Error") ? (
                <AlertCircle className="w-4 h-4" />
              ) : status.includes("successfully") ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              )}
              <span className="text-sm">{status}</span>
            </div>
          )}

          {documentContent && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                PDF Content
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {documentContent}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
