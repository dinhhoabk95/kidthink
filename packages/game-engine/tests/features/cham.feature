Feature: Hành vi chạm (tap) của họ engine tap

  Scenario Outline: Chạm nền thì không method nào chạy
    Given session <template_code> được khởi tạo với cấu hình hợp lệ
    When bé chạm vào toạ độ nền ngoài mọi ô đích
    Then không có action nào được commit
    And trạng thái session giữ nguyên

    Examples:
      | template_code |
      | GT-001        |

  Scenario Outline: Chạm lại vào đích đã chọn thì giữ
    Given session <template_code> đã chọn một đích hợp lệ
    When bé chạm lại vào chính toạ độ của đích đã chọn
    Then đích vẫn giữ nguyên trạng thái đã chọn
    And không có lỗi hoặc reset trạng thái

    Examples:
      | template_code |
      | GT-001        |

  Scenario Outline: Vòng hai dùng hình học vòng hai
    Given session <template_code> có nhiều vòng chơi
    When hoàn thành vòng một và chuyển sang vòng hai với số lựa chọn n = 4
    Then bé chạm vào toạ độ ô thứ tư của vòng hai được nhận diện chính xác
    And toạ độ này nằm ngoài vùng ô của vòng một

    Examples:
      | template_code |
      | GT-001        |
