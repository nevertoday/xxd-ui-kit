# 逐条比较两次 node --test --test-reporter=tap 的失败测试：python3 scripts/verify/tap-fail-diff.py base.tap after.tap

import sys,re
# 从 TAP 输出里取出失败的测试（带上层套件路径），用于逐条比较
def fails(path):
    out=set(); stack=[]
    for line in open(path,encoding='utf-8',errors='replace'):
        m=re.match(r'^(\s*)(not ok|ok) \d+ - (.*?)(?: # .*)?$', line.rstrip('\n'))
        if m:
            depth=len(m.group(1))//4
            name=m.group(3)
            if m.group(2)=='not ok': out.add((depth,name))
    return out
a=fails(sys.argv[1]); b=fails(sys.argv[2])
print('base fails',len(a),'after fails',len(b))
print('only after:',sorted(n for _,n in b-a)[:40])
print('only base:',sorted(n for _,n in a-b)[:40])
