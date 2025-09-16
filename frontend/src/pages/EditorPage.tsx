import React from 'react';
import { useParams } from 'react-router-dom';

const EditorPage: React.FC = () => {
  const { photoId } = useParams<{ photoId: string }>();

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Photo Editor
        </h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Edit your photo with various tools and filters.
        </p>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar with editing tools */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Adjustments</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Brightness</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Contrast</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Saturation</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Filters</h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-2 text-xs border rounded hover:bg-gray-50">
                  Original
                </button>
                <button className="p-2 text-xs border rounded hover:bg-gray-50">
                  Vintage
                </button>
                <button className="p-2 text-xs border rounded hover:bg-gray-50">
                  B&W
                </button>
                <button className="p-2 text-xs border rounded hover:bg-gray-50">
                  Sepia
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Actions</h4>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">
                  Save Changes
                </button>
                <button className="w-full px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main editing area */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="w-96 h-64 bg-gray-200 rounded flex items-center justify-center">
              <p className="text-gray-500">Photo {photoId} would be displayed here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;