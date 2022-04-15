* nodejs가 설치 되어 있어야 함
* 본 코드는 ~/.aws의 credentials을 읽어 수정 한다. 최초 적용시 만일을 대비 ./aws/credentials 을 백업해둘 것

---

설치 실행방법

1. git clone으로 다운로드, npm install 실행
2. mfa를 사용할 기존 profile의 이름앞에 mfa: 를 붙인다. (예시#1 참조)
2. mfa: 가 붙은 prfile에 mfa 인증시 사용하는 arn을 추가한다. (예시#1 참조)
3. mfa.js를 실행후 profile을 선택하고 mfa number를 입력한다.
4. credential file을 확인하면 발급받은 키가 추가되어 있다. (예시#2 참조)

---

예시#1 mfa로 로그인할 기존 credential 파일 변경예시.

변경전
[myaws]
aws_access_key_id=...
aws_secret_access_key=...

변경후
[mfa:myaws]
aws_access_key_id=...
aws_secret_access_key=...
mfa:arn=arn:aws:iam::...:mfa/...@...

---

예시#2 명령어 실행후 생성예시- mfa:myaws로 myaws를 생성한다.

[mfa:myaws]
aws_access_key_id=...
aws_secret_access_key=...
mfa:arn=arn:aws:iam::...:mfa/...

[myaws]
aws_access_key_id=...
aws_secret_access_key=...
aws_session_token=...
mfa:expiration=2022-04-15T12:00:00Z

