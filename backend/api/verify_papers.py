"""Quick script to verify papers and claims for MVP sprint."""
import sys
sys.path.insert(0, '.')

from app.dependencies import get_supabase_db

def main():
    db = get_supabase_db()

    papers = {
        'TextCNN': '15017eb5-68ee-4dcb-b3b4-1c98479c3a93',
        'CharCNN': '8479e2f7-78fe-4098-b949-5899ce07f8c9',
        'DenseNet': '3e585dc9-5968-4458-b81f-d1146d2577e8',
    }

    print("=" * 60)
    print("PAPER VERIFICATION")
    print("=" * 60)

    for name, paper_id in papers.items():
        paper = db.get_paper(paper_id)
        if paper:
            print(f"✓ {name:15} | {paper.slug:25} | {paper.title[:30]}...")
        else:
            print(f"✗ {name:15} | NOT FOUND IN DATABASE")

    print("\n" + "=" * 60)
    print("CLAIMS VERIFICATION")
    print("=" * 60)

    for name, paper_id in papers.items():
        result = db.client.table("claims").select("id").eq("paper_id", paper_id).execute()
        count = len(result.data) if result.data else 0
        if count > 0:
            print(f"✓ {name:15} | {count:3} claims found")
        else:
            print(f"✗ {name:15} | NO CLAIMS FOUND")

    print("=" * 60)

if __name__ == "__main__":
    main()
