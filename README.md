# KOEN-Yeosu

한국남동발전 여수발전본부의 SMART LOTO 키 보관함 키오스크 **WPF 앱** 개발 리포지토리입니다.

## 메인 앱: WPF

운영/납품 대상의 메인 코드는 WPF 프로젝트로 관리합니다.

- 솔루션: `KOEN-Yeosu.sln`
- WPF 프로젝트: `src/KOENYeosu.Kiosk/`
- 진입 화면: `src/KOENYeosu.Kiosk/MainWindow.xaml`

> 이 저장소의 기본 개발 방향은 WPF 앱입니다. 웹/HTML 파일과 첨부 이미지는 구현 참고용 프로토타입으로만 분리 보관합니다.

## Prototype

첨부받은 HTML/CSS/JavaScript 및 이미지 기반 프로토타입은 WPF 앱과 분리하여 `prototype/` 폴더에서 관리합니다.

- 웹 프로토타입: `prototype/web/index.html`
- 첨부 원본 이미지: `prototype/attachments/`
- 프로토타입 참고 이미지: `prototype/assets/`
- 로컬 확인: `prototype/web/index.html`을 브라우저로 열기
- GitHub Pages 배포 대상: `prototype/web/`
- 배포 주소: <https://artrovision.github.io/KOEN-Yeosu/>

## 첨부 원본 파일

요청에 따라 전달받은 첨부 이미지를 변환 없이 그대로 저장했습니다.

- [RFID 키 이미지](prototype/attachments/img_21894a2b368c.png)
- [3D 경로 안내 이미지](prototype/attachments/img_67bfe7da30eb.png)
- [블루프린트 경로 안내 이미지](prototype/attachments/img_97e677134975.jpeg)
