"use client";

import React, { useState, ChangeEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Download, Upload } from 'lucide-react';

interface Field {
  name: string;
  start: number;
  end: number;
}

interface NewField {
  name: string;
  start: string;
  end: string;
}

interface ParsedRecord {
  [key: string]: string;
}

const FixedWidthParser: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [newField, setNewField] = useState<NewField>({ name: '', start: '', end: '' });
  const [fileContent, setFileContent] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addField = () => {
    if (newField.name && newField.start && newField.end) {
      const startNum = parseInt(newField.start);
      const endNum = parseInt(newField.end);
      
      if (startNum >= endNum) {
        setError('Start position must be less than end position');
        return;
      }

      const newFieldData: Field = {
        name: newField.name,
        start: startNum,
        end: endNum
      };

      if (validateField(newFieldData)) {
        setFields([...fields, newFieldData]);
        setNewField({ name: '', start: '', end: '' });
        setError(null);
      }
    }
  };

  const validateField = (field: Field): boolean => {
    // Check for overlapping fields
    const hasOverlap = fields.some(f => 
      (field.start >= f.start && field.start <= f.end) ||
      (field.end >= f.start && field.end <= f.end)
    );

    if (hasOverlap) {
      setError('Field positions overlap with existing fields');
      return false;
    }

    return true;
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result as string;
        if (content) {
          setFileContent(content);
          parseContent(content);
        }
      };
      reader.readAsText(file);
    }
    setIsLoading(false);
  };

  const parseContent = (content: string) => {
    if (!content || fields.length === 0) return;

    const lines = content.split('\n');
    const parsed = lines.map(line => {
      if (!line.trim()) return null;
      
      const record: ParsedRecord = {};
      fields.forEach(field => {
        record[field.name] = line.substring(field.start - 1, field.end).trim();
      });
      return record;
    }).filter((record): record is ParsedRecord => record !== null);

    setParsedData(parsed);
  };

  const handleManualInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setFileContent(content);
    parseContent(content);
  };

  const exportFieldsToJson = () => {
    const jsonString = JSON.stringify(fields, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'field-mappings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFieldMappingUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const content = e.target?.result as string;
          const uploadedFields = JSON.parse(content) as Field[];
          
          if (Array.isArray(uploadedFields) && uploadedFields.every(field => 
            field.name && typeof field.start === 'number' && typeof field.end === 'number'
          )) {
            setFields(uploadedFields);
            if (fileContent) {
              parseContent(fileContent);
            }
            setError(null);
          } else {
            setError('Invalid field mapping format');
          }
        } catch (error) {
          setError('Error parsing JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fixed Width File Parser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            {/* Field Mapping Controls */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFieldMappingUpload}
                  className="hidden"
                  id="mapping-upload"
                />
                <label htmlFor="mapping-upload">
                  <Button variant="outline" className="mr-2" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Fields
                    </span>
                  </Button>
                </label>
                <Button 
                  variant="outline"
                  onClick={exportFieldsToJson}
                  disabled={fields.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Fields
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Field Name</label>
                <Input
                  type="text"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  placeholder="Enter field name"
                  className="w-48"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Position</label>
                <Input
                  type="number"
                  value={newField.start}
                  onChange={(e) => setNewField({ ...newField, start: e.target.value })}
                  placeholder="Start"
                  className="w-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Position</label>
                <Input
                  type="number"
                  value={newField.end}
                  onChange={(e) => setNewField({ ...newField, end: e.target.value })}
                  placeholder="End"
                  className="w-24"
                />
              </div>
              <Button onClick={addField}>Add Field</Button>
            </div>

            {fields.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left">Field Name</th>
                      <th className="border p-2 text-left">Start</th>
                      <th className="border p-2 text-left">End</th>
                      <th className="border p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={index}>
                        <td className="border p-2">{field.name}</td>
                        <td className="border p-2">{field.start}</td>
                        <td className="border p-2">{field.end}</td>
                        <td className="border p-2">
                          <Button variant="ghost" size="sm" onClick={() => removeField(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">Upload File or Paste Content</label>
              <Input
                type="file"
                onChange={handleFileUpload}
                className="mb-2"
              />
              <textarea
                value={fileContent}
                onChange={handleManualInput}
                placeholder="Or paste your content here..."
                className="w-full h-32 p-2 border rounded"
              />
            </div>

            {isLoading && (
              <div className="text-center py-4">
                Loading...
              </div>
            )}

            {parsedData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {fields.map((field, index) => (
                        <th key={index} className="border p-2 text-left">{field.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((record, index) => (
                      <tr key={index}>
                        {fields.map((field, fieldIndex) => (
                          <td key={fieldIndex} className="border p-2">{record[field.name]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedWidthParser;