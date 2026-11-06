import asyncio,sys
from playwright.async_api import async_playwright
THREE=open('three.min.js  (download three@0.128.0 build/three.min.js from npm)','rb').read()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':1400,'height':900})
        errs=[]
        pg.on('console',lambda m: errs.append(m.type+': '+m.text) if m.type in('error','warning') else None)
        pg.on('pageerror',lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.route('https://cdnjs.cloudflare.com/**',lambda r: r.fulfill(status=200,content_type='application/javascript',body=THREE))
        await pg.goto('file://'+__import__('os').path.abspath(sys.argv[1] if len(sys.argv)>1 else '../grid_fleet_dashboard.html')+'')
        await pg.wait_for_timeout(1500)
        await pg.evaluate("T=60;render()")
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path='shot_t60.png',full_page=False)
        await pg.evaluate("T=130;render()")
        await pg.wait_for_timeout(1000)
        await pg.screenshot(path='shot_t130.png',full_page=False)
        print('\n'.join(errs[:20]) or 'no console errors')
        await b.close()
asyncio.run(main())
