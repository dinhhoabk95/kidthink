Feature: Hành vi kéo thả (drop) và fallback chạm-chạm của họ engine drag-drop

  Scenario Outline: Kéo thả trúng đích thì commit action tương ứng
    Given session <template_code> được khởi tạo với cấu hình hợp lệ
    When bé kéo từ ô nguồn và thả trúng vùng ô đích
    Then action tương ứng được commit
    And trạng thái session được cập nhật thành công

    Examples:
      | template_code |
      | GT-003        |
      | GT-004        |
      | GT-005        |
      | GT-006        |
      | GT-007        |
      | GT-008        |
      | GT-014        |
      | GT-015        |
      | GT-019        |
      | GT-021        |

  Scenario Outline: Thả ngoài mọi đích thì không commit và vật về chỗ cũ
    Given session <template_code> được khởi tạo với cấu hình hợp lệ
    When bé kéo từ ô nguồn và thả ra ngoài mọi ô đích
    Then không có action drop nào được commit
    And trạng thái session giữ nguyên

    Examples:
      | template_code |
      | GT-003        |
      | GT-004        |
      | GT-005        |
      | GT-006        |
      | GT-007        |
      | GT-008        |
      | GT-014        |
      | GT-015        |
      | GT-019        |
      | GT-021        |

  Scenario Outline: Fallback chạm-chạm (tap-tap fallback)
    Given session <template_code> hỗ trợ fallback chạm-chạm
    When bé chạm lần 1 vào ô nguồn để nhắm và chạm lần 2 vào ô đích
    Then action hoàn thành thao tác được commit

    Examples:
      | template_code |
      | GT-003        |
      | GT-004        |
      | GT-005        |
      | GT-006        |
      | GT-007        |
      | GT-008        |
      | GT-014        |
      | GT-015        |
      | GT-019        |
      | GT-021        |
