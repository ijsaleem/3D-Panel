import { PanelPlugin } from '@grafana/data';
import { ThreeDOptions } from './types';
import { ThreeDPanel } from './components/ThreeDPanel';

export const plugin = new PanelPlugin<ThreeDOptions>(ThreeDPanel).setPanelOptions(builder =>
  builder
    .addSelect({
      path: 'shapeType',
      name: 'Shape Type',
      description: 'The type of 3D shape to display',
      settings: {
        options: [
          { label: 'Sphere', value: 'sphere' },
          { label: 'Cube', value: 'cube' },
          { label: 'Cone', value: 'cone' },
          { value: 'custom', label: 'Custom (from URL)' },
        ],
      },
      defaultValue: 'sphere',
    })

    .addTextInput({
      path: 'customModelUrl',
      name: 'Model File URL',
      description: 'Enter a full URL to a .glb, .gltf, .obj, or .stl file',
      showIf: cfg => cfg.shapeType === 'custom',
    })

    .addNumberInput({
      path: 'scale',
      name: 'Scale',
      description: 'Uniform scale factor of the shape',
      defaultValue: 0.5,
      settings: {
        min: 0.1,
        max: 10,
        step: 0.1,
      },
    })
    .addNumberInput({
        path: 'maxX',
        name: 'Max X Axis',
        description: 'Maximum value for the X axis',
        defaultValue: 5,
    })
    .addNumberInput({
        path: 'maxY',
        name: 'Max Y Axis',
        description: 'Maximum value for the Y axis',
        defaultValue: 5,
    })
    .addNumberInput({
        path: 'maxZ',
        name: 'Max Z Axis',
        description: 'Maximum value for the Z axis',
        defaultValue: 5,
    })
    .addBooleanSwitch({
        path: 'showNegativeAxes',
        name: 'Show Negative Axes',
        description: 'Display the negative side of the grid and axis lines',
        defaultValue: true,
    })
    .addColorPicker({
        path: 'shapeColor',
        name: 'Shape Color',
        description: 'Color of the 3D shape',
        defaultValue: '#ff0000', // red by default
    })



);
