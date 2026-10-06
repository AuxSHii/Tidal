#tidal

tidal is a web app , i am developing ;
goal: to eventually calculate realistic marine vessel routes over earth while accounting for geographic constraints,
vessel characterstic, ocean condition etc

its still under active dev. currently focusing on building a solid geographic and routing foundation before adding any complex or real time environment data

##What it does?
1. represent geographic coordinates using WGS84
2. calculate geodesic distances and bearings
3. generate routes between geographic points
4. model land constraints using Natural Earth data
5. compile global land information into a 0.1° navigation raster
6. build an ocean navigation graph
7. avoid land when constructing navigable connections
8. calculate a shortest-path route through the graph
9. validate candidate routes against the underlying geographic data

The current routing system is intentionally more concerned with geographic correctness than with producing a visually impressive route.

##ui - 
   currently centred around map and voyage input

##Routing system:
1. geographic cordinate parsing
2. WGS84 geodesic calc
3. Natural Earth land geometry
3. 0.1 deg nav raster
4. ocean/land/coast classification
5. nav graph build
6. land constraint grapgh edges
7. shortes path search
8. route rendering [if found]

note: when raster cannot certify an edge as open ocean ,  it falls back to natural earth geometry's "exact validations" which is implemented.

##raster:
  its a grid that divides a geographic space into small cells with each cell string a value represneting whats there[cell definition]
tidal's compiled global navigation raster
  the world is divided into 
  ```  3600 x 1800 cells    ```
  at a resolution of
  ``` 0.1° x 0.1°  ```
  each cell contain one byte representing:
  ``` 
  0 = OCEAN
  1 = LAND
  2 = COAST
  ```
  complete state array is pre-computed with a build script [in scripts/] , size around 6.48mb
  its generated from Natural Earth land geometry[geojson] rather then being created manualyy
  COMPILER : uses polygon boundary rasterization and scanline filling to construct the global/land classification.

 ##Geographic correctness
 tested raster against many geographic cases,
  like
   1. open Pacific and Atlantic ocean
   2. Sahara
   3. India
   4. Australia
   5. Greenland
   6. Antarctica
   7. Japan
   8. Iceland
   9. Mediterranean
   10. Black Sea
   11. Arctic and Antarctic regions
       islands
   12. the antimeridian
   13. the Bering region
               etc{i am forgetting many rn}
    

  raster currently contains:
  ```
  OCEAN: 4,275,402
  LAND: 2,080,029
  COAST: 124,569
  ```
 with 0: unknow cells [see in screenshot]

 ##performace:
    i spent a lot of time optimizing it .. its not there yet , current benchmarks are
   [see in screenshot]

##future:
   1. major parts are to intoduce vessels , fuel models , ports varaiables based on access
   2. real time env. factors
   3. route optimizations - zermol navigations , eikonal / ordered upwind methods , multi objective routing.

##known limitations:  
   as tidal isnt finished it has limitations  like:
   1. current graph-based navigator has cases where longer route requiring significant curvature or detours due to land constraints are not found even though a continious ocean route should exist for those coordinatess.
   2. currently no realisitc ocean-current , wind , wave or barthymetry data sets.
   ill be adding and removing these as i go .













