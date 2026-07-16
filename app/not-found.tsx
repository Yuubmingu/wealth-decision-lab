import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function NotFound() { return <main className="not-found shell"><span>404</span><h1>요청하신 페이지를 찾을 수 없습니다.</h1><p>주소가 변경되었거나 아직 준비되지 않은 페이지입니다.</p><Link href="/"><ArrowLeft size={17} /> 연구소 홈으로 돌아가기</Link></main>; }
