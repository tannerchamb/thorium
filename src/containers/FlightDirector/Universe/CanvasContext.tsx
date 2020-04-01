import * as React from "react";

export enum ActionType {
  dragging,
  dropped,
}
export const CanvasContext = React.createContext<
  [CanvasContextState, React.Dispatch<CanvasContextAction>]
>([{dragging: false, camera: false, zoomScale: false}, () => {}]);

interface CanvasContextState {
  dragging: boolean;
  camera: boolean;
  zoomScale: boolean;
}
interface CanvasContextAction {
  type: ActionType;
}
const canvasContextReducer = (
  state: CanvasContextState,
  action: CanvasContextAction,
) => {
  if (action.type === ActionType.dragging) {
    return {...state, dragging: true};
  }
  if (action.type === ActionType.dropped) {
    return {...state, dragging: false};
  }
  return state;
};

type ReducerSignature = (
  state: CanvasContextState,
  action: CanvasContextAction,
) => CanvasContextState;
interface CanvasContextProps {
  zoomScale: boolean;
  recenter: any;
  camera: boolean;
}
const CanvasContextProvider: React.FC<CanvasContextProps> = ({
  recenter,
  camera,
  zoomScale,
  children,
}) => {
  const [state, dispatch] = React.useReducer<ReducerSignature>(
    canvasContextReducer,
    {
      dragging: false,
      camera: false,
      zoomScale: false,
    },
  );
  const value: [
    CanvasContextState,
    React.Dispatch<CanvasContextAction>,
  ] = React.useMemo(() => {
    return [{...state, camera, zoomScale}, dispatch];
  }, [state, camera, zoomScale]);

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
};

export default CanvasContextProvider;
