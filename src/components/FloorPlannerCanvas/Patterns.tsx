const Patterns = () => {
	return (
		<>
			<pattern id="grass" patternUnits="userSpaceOnUse" width="256" height="256">
				<image
					xlinkHref="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWh5nEP_Trwo96CJjev6lnKe0_dRdA63RJFaoc3-msedgxveJd"
					x="0"
					y="0"
					width="256"
					height="256"
				/>
			</pattern>
			<pattern id="wood" patternUnits="userSpaceOnUse" width="32" height="256">
				<image
					xlinkHref="https://orig00.deviantart.net/e1f2/f/2015/164/8/b/old_oak_planks___seamless_texture_by_rls0812-d8x6htl.jpg"
					x="0"
					y="0"
					width="256"
					height="256"
				/>
			</pattern>
			<pattern id="tiles" patternUnits="userSpaceOnUse" width="25" height="25">
				<image
					xlinkHref="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrkoI2Eiw8ya3J_swhfpZdi_ug2sONsI6TxEd1xN5af3DX9J3R"
					x="0"
					y="0"
					width="256"
					height="256"
				/>
			</pattern>
			<pattern id="granite" patternUnits="userSpaceOnUse" width="256" height="256">
				<image
					xlinkHref="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9_nEMhnWVV47lxEn5T_HWxvFwkujFTuw6Ff26dRTl4rDaE8AdEQ"
					x="0"
					y="0"
					width="256"
					height="256"
				/>
			</pattern>
			<pattern id="smallGrid" width="60" height="60" patternUnits="userSpaceOnUse">
				<path d="M 60 0 L 0 0 0 60" fill="none" stroke="#777" strokeWidth="0.25" />
			</pattern>
			<pattern id="grid" width="180" height="180" patternUnits="userSpaceOnUse">
				<rect width="180" height="180" fill="url(#smallGrid)" />
				<path
					d="M 200 10 L 200 0 L 190 0 M 0 10 L 0 0 L 10 0 M 0 190 L 0 200 L 10 200 M 190 200 L 200 200 L 200 190"
					fill="none"
					stroke="#999"
					strokeWidth="0.8"
				/>
			</pattern>
			<pattern
				id="hatch"
				width="5"
				height="5"
				patternTransform="rotate(50 0 0)"
				patternUnits="userSpaceOnUse">
				<path d="M 0 0 L 0 5 M 10 0 L 10 10 Z" style={{ stroke: '#666', strokeWidth: 5 }} />
			</pattern>
		</>
	);
};
export default Patterns;
