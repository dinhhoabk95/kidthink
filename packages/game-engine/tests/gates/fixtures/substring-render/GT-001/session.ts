// Fixture vi phạm: file có chuỗi `render(` nhưng KHÔNG có chữ ký render() thật.
// Bản cũ của cổng nhận file này là "đã cài render" vì nhánh
// `content.includes("render(")` khớp dòng dưới đây.
export class GT001Session {
  private readonly renderSystem = { render: (): void => undefined };

  tick(): void {
    this.renderSystem.render();
  }
}
