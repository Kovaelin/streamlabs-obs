/**
 * abstract class for representing scene's folders and items
 */
import { ServiceHelper, mutation } from '../stateful-service';
import { TSceneNodeType } from './scenes-api';
import { Inject } from '../../util/injector';
import { ScenesService, Scene, ISceneItemNode, SceneItemFolder, SceneItem } from './index';
import { SelectionService } from 'services/selection';

@ServiceHelper()
export abstract class SceneItemNode implements ISceneItemNode {

  id: string;
  parentId: string;
  childrenIds: string[];
  sceneNodeType: TSceneNodeType;
  resourceId: string;
  sceneId: string;

  private _resourceId: string;

  @Inject() protected scenesService: ScenesService;
  @Inject() protected selectionService: SelectionService;

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

  setParent(parentId: string) {
    this.SET_PARENT(parentId);
    this.placeAfter(parentId);
  }

  detachParent() {
    if (this.parentId) this.SET_PARENT(null);
  }

  getParent(): SceneItemFolder {
    return this.getScene().getFolder(this.parentId);
  }

  hasParent(): boolean {
    return !!this.getState().parentId;
  }

  getNodeIndex(): number {
    return this.getScene().getNodesIds().indexOf(this.id);
  }

  placeAfter(nodeId: string) {
    this.getScene().placeAfter(this.id, nodeId);
  }

  placeBefore(nodeId: string) {
    this.getScene().placeBefore(this.id, nodeId);
  }

  getPrevNode() {
    const nodeInd = this.getNodeIndex();
    return this.getScene().getNodes()[nodeInd - 1];
  }

  getNextNode() {
    const nodeInd = this.getNodeIndex();
    return this.getScene().getNodes()[nodeInd + 1];
  }

  getPrevSiblingNode() {
    const siblingsIds = this.parentId ?
      this.getParent().getNestedNodesIds() :
      this.getScene().getRootNodesIds();

    const childInd = siblingsIds.indexOf(this.id);
    if (childInd !== 0) return this.getScene().getNode(siblingsIds[childInd - 1]);
  }

  getPrevItem(): SceneItem {
    let nodeInd = this.getNodeIndex();
    const nodes = this.getScene().getNodes();
    while (nodeInd--) {
      if (nodes[nodeInd].isItem()) return nodes[nodeInd] as SceneItem;
    }
    return null;
  }

  getNextItem(): SceneItem {
    let nodeInd = this.getNodeIndex();
    const nodes = this.getScene().getNodes();
    while (nodeInd++) {
      if (!nodes[nodeInd]) return null;
      if (nodes[nodeInd].isItem()) return nodes[nodeInd] as SceneItem;
    }
  }

  isSelected() {
    return this.selectionService.isSelected(this.id);
  }

  select() {
    this.selectionService.select(this.id);
  }

  addToSelection() {
    this.selectionService.add(this.id);
  }

  deselect() {
    this.selectionService.deselect(this.id);
  }

  isFolder(): this is SceneItemFolder {
    return this.sceneNodeType === 'folder';
  }

  isItem(): this is SceneItem {
    return this.sceneNodeType === 'item';
  }

  getResourceId() {
    return this._resourceId;
  }

  protected abstract getState(): ISceneItemNode;
  protected abstract remove(): void;


  @mutation()
  protected SET_PARENT(parentId?: string) {
    const state = this.getState();
    const currentParent = this.getScene().getFolder(state.parentId);
    if (currentParent) {
      const childInd = currentParent.childrenIds.indexOf(this.id);
      currentParent.childrenIds.splice(childInd, 1);
    }
    state.parentId = parentId;
    if (!parentId) return;
    const newParent = this.getScene().getFolder(parentId);
    newParent.childrenIds.unshift(this.id);
  }

}
