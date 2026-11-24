import type { RenderSystem } from "#src/systems/render-system";
import {
  drawArtScene,
  drawBodyScene,
  drawDefaultScene,
  drawFamilyScene,
  drawFestivalScene,
  drawFoodScene,
  drawHomeScene,
  drawSchoolScene,
} from "./scene-themes-indoor.js";
import {
  drawAnimalScene,
  drawFarmScene,
  drawNatureScene,
  drawOceanScene,
  drawSpaceScene,
  drawVehicleScene,
  drawWeatherScene,
} from "./scene-themes-outdoor.js";

export type ScenePainter = (
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number,
  timeMs?: number
) => void;

/** Hoạ sĩ nền theo chủ đề; chủ đề lạ rơi về nền mặc định. `Map` thay object: tra
 * `"constructor"` trên object trả về hàm của `Object.prototype`. */
export const SCENE_PAINTERS: ReadonlyMap<string, ScenePainter> = new Map([
  // 16 chủ đề nội dung chuẩn
  ["nature", drawNatureScene],
  ["farm", drawFarmScene],
  ["ocean", drawOceanScene],
  ["space", drawSpaceScene],
  ["school", drawSchoolScene],
  ["home", drawHomeScene],
  ["animal", drawAnimalScene],
  ["food", drawFoodScene],
  ["vehicle", drawVehicleScene],
  ["art", drawArtScene],
  ["family", drawFamilyScene],
  ["body", drawBodyScene],
  ["weather", drawWeatherScene],
  ["festival", drawFestivalScene],
  ["homeland", drawFarmScene],
  ["job", drawArtScene],
  // 10 chủ đề Giáo dục Mầm non Việt Nam
  ["mam_non", drawSchoolScene],
  ["ban_than", drawBodyScene],
  ["gia_dinh", drawFamilyScene],
  ["nghe_nghiep", drawArtScene],
  ["thuc_vat", drawNatureScene],
  ["dong_vat", drawAnimalScene],
  ["giao_thong", drawVehicleScene],
  ["hien_tuong_tu_nhien", drawWeatherScene],
  ["que_huong", drawFarmScene],
  ["tieu_hoc", drawSchoolScene],
  // Bí danh dân gian mở rộng & mặc định
  ["default", drawDefaultScene],
  ["general", drawDefaultScene],
  ["village", drawFarmScene],
  ["countryside", drawNatureScene],
  ["lotus-pond", drawNatureScene],
  ["tet", drawFestivalScene],
  ["mid-autumn", drawFestivalScene],
  ["bamboo-school", drawSchoolScene],
]);
